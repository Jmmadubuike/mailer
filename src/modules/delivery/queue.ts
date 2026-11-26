import "server-only";
import { randomUUID } from "node:crypto";
import { getEnv } from "@/config/env";
import {
  DeliveryJob,
  type IDeliveryJob,
  type DeliveryJobStatus,
} from "@/models/DeliveryJob";
import {
  CampaignRecipient,
  type ICampaignRecipient,
} from "@/models/CampaignRecipient";
import { Campaign } from "@/models/Campaign";
import { Contact } from "@/models/Contact";
import { Suppression } from "@/models/Suppression";
import { SendingDomain } from "@/models/SendingDomain";
import { assertSendableDomain } from "@/modules/sending-domains/service";
import { sendThroughDomain } from "@/lib/resend/send";
import {
  DEFAULT_PERSONALIZATION_FALLBACKS,
  renderTemplate,
} from "@/modules/personalization/render";
import { createUnsubscribeToken } from "@/modules/unsubscribe/token";
import { sanitizeEmailHtml } from "@/lib/security/sanitize";
import {
  assertSendingEnabled,
  releaseDailySend,
  reserveDailySend,
} from "@/modules/settings/service";
import { htmlToText } from "@/lib/email/html-to-text";
import { decideSuppressionOutcome } from "@/modules/delivery/suppression";
import { classifyDeliveryError } from "@/modules/delivery/classification";

const LEASE_MS = 5 * 60 * 1000;

export interface QueueRunResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

async function recoverStaleJobs(): Promise<number> {
  const result = await DeliveryJob.updateMany(
    { status: "processing", leaseUntil: { $lt: new Date() } },
    {
      $set: {
        status: "pending",
        leaseUntil: null,
        lockedAt: null,
        workerRunId: null,
      },
    },
  );
  return result.modifiedCount ?? 0;
}

async function claimJobs(limit: number): Promise<IDeliveryJob[]> {
  const now = new Date();
  const claimableStatuses: DeliveryJobStatus[] = ["pending", "retry_pending"];
  const filter = {
    status: { $in: claimableStatuses },
    $or: [{ nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
  };

  const candidates = await DeliveryJob.find(filter)
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();

  if (candidates.length === 0) return [];

  const runId = randomUUID();
  const ids = candidates.map((candidate) => candidate._id);

  await DeliveryJob.updateMany(
    { _id: { $in: ids }, ...filter },
    {
      $set: {
        status: "processing",
        leaseUntil: new Date(now.getTime() + LEASE_MS),
        lockedAt: now,
        workerRunId: runId,
      },
    },
  );

  return DeliveryJob.find({ workerRunId: runId }).lean();
}

export async function processQueue(
  limit = getEnv().WORKER_BATCH_SIZE,
): Promise<QueueRunResult> {
  await recoverStaleJobs();
  const jobs = await claimJobs(limit);
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const affectedCampaigns = new Set<string>();

  for (const job of jobs) {
    affectedCampaigns.add(job.campaignId.toString());
    const outcome = await processJob(job);
    if (outcome === "sent") sent += 1;
    if (outcome === "failed") failed += 1;
    if (outcome === "skipped") skipped += 1;
  }

  for (const campaignId of affectedCampaigns) {
    await finalizeCampaign(campaignId);
  }

  return { processed: jobs.length, sent, failed, skipped };
}

async function finalizeCampaign(campaignId: string): Promise<void> {
  const campaign = await Campaign.findById(campaignId)
    .select("status recipientCount")
    .lean();
  if (!campaign || !["queued", "sending"].includes(campaign.status)) return;

  const pending = await DeliveryJob.countDocuments({
    campaignId,
    status: { $in: ["pending", "retry_pending", "processing"] },
  });
  if (pending > 0) return;

  const failed = await DeliveryJob.countDocuments({
    campaignId,
    status: "failed",
  });

  if ((campaign.recipientCount ?? 0) === 0) {
    await Campaign.updateOne(
      { _id: campaignId },
      { $set: { status: "failed", completedAt: new Date() } },
    );
    return;
  }

  await Campaign.updateOne(
    { _id: campaignId },
    {
      $set: {
        status: failed > 0 ? "partially_failed" : "sent",
        completedAt: new Date(),
      },
    },
  );
}

export async function finalizeStalledCampaigns(): Promise<number> {
  const active = await Campaign.find({
    status: { $in: ["queued", "sending"] },
  })
    .select("_id")
    .lean();

  let finalized = 0;
  for (const campaign of active) {
    await finalizeCampaign(campaign._id.toString());
    const current = await Campaign.findById(campaign._id).select("status").lean();
    if (current && ["sent", "partially_failed", "failed"].includes(current.status)) {
      finalized += 1;
    }
  }
  return finalized;
}

async function processJob(
  job: IDeliveryJob,
): Promise<"sent" | "failed" | "skipped"> {
  const recipient = await CampaignRecipient.findById(job.recipientId);
  const campaign = await Campaign.findById(job.campaignId);

  if (!recipient || !campaign) {
    await DeliveryJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "failed",
          errorClass: "permanent",
          lastError: "Recipient or campaign record is missing",
        },
      },
    );
    return "failed";
  }

  // Internal idempotency: never send twice for the same recipient.
  if (recipient.providerMessageId) {
    await DeliveryJob.updateOne(
      { _id: job._id },
      { $set: { status: "sent" } },
    );
    return "skipped";
  }

  const domainId = job.sendingDomainId.toString();

  try {
    await assertSendableDomain(domainId, campaign.fromEmail);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Domain not sendable";
    await permanentFailure(job, recipient, message);
    return "failed";
  }

  try {
    await assertSendingEnabled();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sending is disabled";
    await retryableFailure(job, recipient, message);
    return "failed";
  }

  // Authoritative suppression re-check immediately before submission.
  try {
    const contact = await Contact.findOne({ email: recipient.email })
      .select("status")
      .lean();
    const suppression = await Suppression.findOne({
      email: recipient.email,
      scope: "all",
    }).lean();
    const decision = decideSuppressionOutcome({
      contactStatus: contact?.status,
      suppressionType: suppression?.type as
        | "unsubscribe"
        | "complaint"
        | "bounce"
        | undefined,
    });
    if (decision.skip) {
      recipient.status = decision.recipientStatus ?? "suppressed";
      recipient.error = decision.reason;
      recipient.events = pushEvent(recipient.events, "suppressed");
      await recipient.save();
      await DeliveryJob.updateOne(
        { _id: job._id },
        { $set: { status: "skipped" }, $inc: { attempts: 1 } },
      );
      return "skipped";
    }
  } catch {
    await retryableFailure(job, recipient, "Suppression check failed");
    return "failed";
  }

  let reservedKey: string | undefined;
  try {
    const reservation = await reserveDailySend();
    if (!reservation.ok) {
      await retryableFailure(job, recipient, "Daily sending limit has been reached");
      return "failed";
    }
    reservedKey = reservation.key;
  } catch {
    await retryableFailure(job, recipient, "Sending limit check failed");
    return "failed";
  }

  const unsubscribeUrl = `${getEnv().APP_URL}/unsubscribe?token=${createUnsubscribeToken(
    getEnv().AUTH_SECRET,
    recipient._id.toString(),
    recipient.email,
  )}`;
  const context: Record<string, unknown> = {
    ...(recipient.personalization ?? {}),
    email: recipient.email,
    unsubscribe_url: unsubscribeUrl,
  };

  const renderedHtml = renderTemplate(
    sanitizeEmailHtml(campaign.htmlContent ?? ""),
    context,
    DEFAULT_PERSONALIZATION_FALLBACKS,
  );

  const result = await sendThroughDomain({
    domainId,
    to: recipient.email,
    subject: renderTemplate(
      campaign.subject,
      context,
      DEFAULT_PERSONALIZATION_FALLBACKS,
      { html: false },
    ),
    html: renderedHtml,
    text: campaign.textContent
      ? renderTemplate(
          campaign.textContent,
          context,
          DEFAULT_PERSONALIZATION_FALLBACKS,
          { html: false },
        )
      : htmlToText(renderedHtml),
    fromName: campaign.fromName,
    fromEmail: campaign.fromEmail,
    replyTo: campaign.replyTo,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    idempotencyKey: job.idempotencyKey,
  });

  if (result.ok) {
    recipient.providerMessageId = result.messageId;
    recipient.status = "sent";
    recipient.sentAt = new Date();
    recipient.events = pushEvent(recipient.events, "sent");
    await recipient.save();

    await DeliveryJob.updateOne(
      { _id: job._id },
      { $set: { status: "sent" }, $inc: { attempts: 1 } },
    );
    await Campaign.updateOne(
      { _id: campaign._id, status: { $in: ["queued", "sending"] } },
      { $set: { status: "sending" } },
    );
    return "sent";
  }

  await releaseDailySend(reservedKey);

  const errorMessage = result.error ?? "Delivery failed";
  const classification = classifyDeliveryError(errorMessage);

  if (classification === "retryable") {
    await retryableFailure(job, recipient, errorMessage);
  } else {
    await permanentFailure(job, recipient, errorMessage);
    await markDomainCredentialInvalid(domainId, errorMessage);
  }
  return "failed";
}

async function retryableFailure(
  job: IDeliveryJob,
  recipient: ICampaignRecipient,
  message: string,
): Promise<void> {
  const attempts = job.attempts + 1;
  if (attempts >= job.maxAttempts) {
    await permanentFailure(job, recipient, message);
    return;
  }
  await DeliveryJob.updateOne(
    { _id: job._id },
    {
      $set: {
        status: "retry_pending",
        attempts,
        errorClass: "retryable",
        lastError: message,
        nextRetryAt: new Date(Date.now() + backoffMs(attempts)),
      },
    },
  );
}

async function permanentFailure(
  job: IDeliveryJob,
  recipient: ICampaignRecipient,
  message: string,
): Promise<void> {
  await DeliveryJob.updateOne(
    { _id: job._id },
    {
      $set: {
        status: "failed",
        errorClass: "permanent",
        lastError: message,
      },
      $inc: { attempts: 1 },
    },
  );

  recipient.status = "failed";
  recipient.error = message;
  recipient.events = pushEvent(recipient.events, "failed");
  await recipient.save();
}

function pushEvent(events: string[], type: string): string[] {
  return events.includes(type) ? events : [...events, type];
}

function backoffMs(attempts: number): number {
  const exponential = Math.min(1000 * 2 ** attempts, 5 * 60 * 1000);
  return exponential + Math.floor(Math.random() * 1000);
}

async function markDomainCredentialInvalid(
  domainId: string,
  message: string,
): Promise<void> {
  const lower = message.toLowerCase();
  if (/(401|403|invalid api key|unauthorized|forbidden)/.test(lower)) {
    await SendingDomain.updateOne(
      { _id: domainId },
      { $set: { credentialStatus: "invalid" } },
    );
  }
}
