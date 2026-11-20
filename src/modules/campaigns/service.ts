import "server-only";
import { Campaign, type ICampaign } from "@/models/Campaign";
import { CampaignRecipient } from "@/models/CampaignRecipient";
import { DeliveryJob } from "@/models/DeliveryJob";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import { assertSendableDomain } from "@/modules/sending-domains/service";
import {
  prepareCampaignDelivery,
  type Actor,
} from "@/modules/delivery/dispatch";
import { processQueue } from "@/modules/delivery/queue";
import { sanitizeEmailHtml } from "@/lib/security/sanitize";
import { sendThroughDomain } from "@/lib/resend/send";
import { renderTemplate } from "@/modules/personalization/render";
import { htmlToText } from "@/lib/email/html-to-text";

export interface CreateCampaignInput {
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  previewText?: string;
  htmlContent?: string;
  textContent?: string;
  sendingDomainId: string;
  selectedLists?: string[];
  selectedSegments?: string[];
  sendMode?: "draft" | "now" | "scheduled";
  scheduledAt?: string;
}

export async function createCampaign(input: CreateCampaignInput, actor: Actor) {
  await assertSendableDomain(input.sendingDomainId, input.fromEmail);

  if (input.sendMode === "scheduled" && !input.scheduledAt) {
    throw new AppError("A scheduled send requires a date and time", 400);
  }

  const existing = await Campaign.findOne({
    name: input.name,
    sendingDomainId: input.sendingDomainId,
    status: { $in: ["draft", "preparing"] },
  });
  if (existing) {
    throw new AppError("A draft campaign with this name already exists", 409);
  }

  const campaign = await Campaign.create({
    name: input.name,
    subject: input.subject,
    fromName: input.fromName,
    fromEmail: input.fromEmail,
    replyTo: input.replyTo,
    previewText: input.previewText,
    htmlContent: input.htmlContent
      ? sanitizeEmailHtml(input.htmlContent)
      : input.htmlContent,
    textContent: input.textContent,
    sendingDomainId: input.sendingDomainId,
    selectedLists: input.selectedLists ?? [],
    selectedSegments: input.selectedSegments ?? [],
    status: input.sendMode === "scheduled" ? "scheduled" : "draft",
    scheduledAt:
      input.sendMode === "scheduled" ? new Date(input.scheduledAt!) : undefined,
    recipientCount: 0,
  });

  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "campaign.created",
    targetType: "Campaign",
    targetId: campaign._id.toString(),
    meta: { sendingDomainId: input.sendingDomainId },
  });

  if (input.sendMode === "now") {
    await prepareCampaignDelivery(campaign._id.toString(), actor);
    await processQueue();
    return Campaign.findById(campaign._id).lean() as Promise<ICampaign>;
  }

  return campaign;
}

export async function listCampaigns(): Promise<ICampaign[]> {
  return Campaign.find().sort({ createdAt: -1 }).lean();
}

export async function cancelCampaign(id: string, actor: Actor): Promise<ICampaign> {
  const campaign = await Campaign.findById(id);
  if (!campaign) throw new AppError("Campaign not found", 404);
  if (["sent", "cancelled"].includes(campaign.status)) {
    throw new AppError(`Campaign is already ${campaign.status}`, 409);
  }

  campaign.status = "cancelled";
  campaign.completedAt = new Date();
  await campaign.save();

  await DeliveryJob.updateMany(
    {
      campaignId: campaign._id,
      status: { $in: ["pending", "retry_pending", "processing"] },
    },
    { $set: { status: "cancelled" } },
  );

  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "campaign.cancelled",
    targetType: "Campaign",
    targetId: id,
  });

  return campaign;
}

export async function rescheduleCampaign(
  id: string,
  input: { name?: string; scheduledAt?: string },
  actor: Actor,
): Promise<ICampaign> {
  const campaign = await Campaign.findById(id);
  if (!campaign) throw new AppError("Campaign not found", 404);
  if (!["draft", "scheduled"].includes(campaign.status)) {
    throw new AppError(`Cannot edit a campaign in "${campaign.status}" state`, 409);
  }

  if (input.name !== undefined) campaign.name = input.name.trim();
  if (input.scheduledAt !== undefined) {
    campaign.status = "scheduled";
    campaign.scheduledAt = new Date(input.scheduledAt);
  }
  await campaign.save();

  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "campaign.updated",
    targetType: "Campaign",
    targetId: id,
  });

  return campaign;
}

export async function sendCampaignNow(
  id: string,
  actor: Actor,
): Promise<{ campaign: ICampaign; queued: number }> {
  const campaign = await Campaign.findById(id);
  if (!campaign) throw new AppError("Campaign not found", 404);
  if (["sent", "sending", "queued"].includes(campaign.status)) {
    throw new AppError(`Campaign is already ${campaign.status}`, 409);
  }
  if (campaign.status === "cancelled") {
    throw new AppError("A cancelled campaign cannot be sent", 409);
  }

  const result = await prepareCampaignDelivery(id, actor);
  await processQueue();

  const updated = await Campaign.findById(id).lean();
  if (!updated) throw new AppError("Campaign not found", 404);

  return { campaign: updated, queued: result.queued };
}

export async function duplicateCampaign(
  id: string,
  actor: Actor,
): Promise<ICampaign> {
  const source = await Campaign.findById(id).lean();
  if (!source) throw new AppError("Campaign not found", 404);

  const copy = await Campaign.create({
    name: `${source.name} (copy)`,
    subject: source.subject,
    fromName: source.fromName,
    fromEmail: source.fromEmail,
    replyTo: source.replyTo,
    previewText: source.previewText,
    htmlContent: source.htmlContent,
    textContent: source.textContent,
    sendingDomainId: source.sendingDomainId,
    status: "draft",
    selectedLists: source.selectedLists,
    selectedSegments: source.selectedSegments,
    recipientCount: 0,
  });

  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "campaign.duplicated",
    targetType: "Campaign",
    targetId: copy._id.toString(),
    meta: { sourceId: id },
  });

  return copy;
}

export async function deleteCampaign(id: string, actor: Actor): Promise<void> {
  const campaign = await Campaign.findById(id);
  if (!campaign) throw new AppError("Campaign not found", 404);

  await DeliveryJob.deleteMany({ campaignId: campaign._id });
  await CampaignRecipient.deleteMany({ campaignId: campaign._id });
  await Campaign.findByIdAndDelete(id);

  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "campaign.deleted",
    targetType: "Campaign",
    targetId: id,
    meta: { name: campaign.name },
  });
}

export async function sendCampaignTest(
  id: string,
  to: string,
  actor: Actor,
): Promise<{ ok: boolean; message: string; messageId?: string }> {
  const campaign = await Campaign.findById(id);
  if (!campaign) throw new AppError("Campaign not found", 404);

  const context = {
    first_name: "Test",
    last_name: "Recipient",
    email: to,
    company: "",
    organization: "",
    unsubscribe_url: "https://example.com/unsubscribe-test",
  };

  const result = await sendThroughDomain({
    domainId: campaign.sendingDomainId.toString(),
    to,
    subject: renderTemplate(campaign.subject, context, {}, { html: false }),
    html: renderTemplate(sanitizeEmailHtml(campaign.htmlContent ?? ""), context),
    text: campaign.textContent
      ? renderTemplate(campaign.textContent, context, {}, { html: false })
      : htmlToText(
          renderTemplate(sanitizeEmailHtml(campaign.htmlContent ?? ""), context),
        ),
    fromName: campaign.fromName,
    fromEmail: campaign.fromEmail,
    replyTo: campaign.replyTo,
  });

  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "campaign.test_sent",
    targetType: "Campaign",
    targetId: id,
    meta: { to, ok: result.ok, messageId: result.messageId },
  });

  return {
    ok: result.ok,
    message: result.ok
      ? `Test email accepted${result.messageId ? ` (message ${result.messageId})` : ""}`
      : result.error ?? "Test failed",
    messageId: result.messageId,
  };
}
