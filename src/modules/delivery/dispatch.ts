import "server-only";
import { Campaign } from "@/models/Campaign";
import { CampaignRecipient } from "@/models/CampaignRecipient";
import { DeliveryJob } from "@/models/DeliveryJob";
import { resolveAudience } from "@/modules/audience/resolve";
import { assertSendableDomain } from "@/modules/sending-domains/service";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";

export interface Actor {
  id: string;
  email: string;
}

export const SYSTEM_ACTOR: Actor = { id: "system", email: "system@local" };

export async function prepareCampaignDelivery(
  campaignId: string,
  actor: Actor,
): Promise<{ queued: number; recipientCount: number }> {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) throw new AppError("Campaign not found", 404);
  if (["sent", "sending", "cancelled"].includes(campaign.status)) {
    throw new AppError(`Campaign is already ${campaign.status}`, 409);
  }

  // Re-validate the sending domain at dispatch time.
  await assertSendableDomain(campaign.sendingDomainId.toString(), campaign.fromEmail);

  const listIds = campaign.selectedLists.map((id) => id.toString());
  const segmentIds = campaign.selectedSegments.map((id) => id.toString());
  const audience = await resolveAudience(listIds, segmentIds);

  if (audience.emails.length === 0) {
    campaign.status = "failed";
    campaign.completedAt = new Date();
    await campaign.save();
    await logAudit({
      actorEmail: actor.email,
      actorId: actor.id,
      action: "campaign.dispatch_failed",
      targetType: "Campaign",
      targetId: campaignId,
      meta: { excludedCount: audience.excludedCount },
    });
    throw new AppError(
      "No eligible recipients found in the selected audience",
      409,
    );
  }

  // Idempotent recipient snapshot creation.
  await CampaignRecipient.bulkWrite(
    audience.emails.map((email) => ({
      updateOne: {
        filter: { campaignId: campaign._id, email },
        update: {
          $setOnInsert: {
            campaignId: campaign._id,
            email,
            sendingDomainId: campaign.sendingDomainId,
            provider: "resend",
            status: "pending",
            events: [],
            personalization: audience.contacts[email] ?? {},
          },
        },
        upsert: true,
      },
    })),
  );

  const recipients = await CampaignRecipient.find({
    campaignId: campaign._id,
    providerMessageId: { $exists: false },
  })
    .select("_id")
    .lean();

  await DeliveryJob.bulkWrite(
    recipients.map((recipient) => ({
      updateOne: {
        filter: {
          idempotencyKey: `${campaign._id.toString()}:${recipient._id.toString()}`,
        },
        update: {
          $setOnInsert: {
            campaignId: campaign._id,
            recipientId: recipient._id,
            sendingDomainId: campaign.sendingDomainId,
            status: "pending",
            idempotencyKey: `${campaign._id.toString()}:${recipient._id.toString()}`,
          },
        },
        upsert: true,
      },
    })),
  );

  campaign.recipientCount = audience.emails.length;
  campaign.status = "queued";
  campaign.startedAt ??= new Date();
  await campaign.save();

  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "campaign.queued",
    targetType: "Campaign",
    targetId: campaignId,
    meta: {
      recipientCount: audience.emails.length,
      excludedCount: audience.excludedCount,
    },
  });

  return {
    queued: recipients.length,
    recipientCount: audience.emails.length,
  };
}

export async function dispatchDueCampaigns(): Promise<number> {
  const now = new Date();
  const due = await Campaign.find({
    status: "scheduled",
    scheduledAt: { $lte: now },
  })
    .select("_id")
    .lean();

  let dispatched = 0;
  for (const campaign of due) {
    const claimed = await Campaign.findOneAndUpdate(
      { _id: campaign._id, status: "scheduled" },
      { $set: { status: "queued" } },
    );
    if (!claimed) continue;

    try {
      await prepareCampaignDelivery(campaign._id.toString(), SYSTEM_ACTOR);
      dispatched += 1;
    } catch (error) {
      console.error(
        `Failed to dispatch scheduled campaign ${campaign._id}`,
        error,
      );
      // If the dispatch failed before creating jobs, revert the claim so the
      // campaign is never stranded in "queued" and later mislabeled "sent".
      const current = await Campaign.findById(campaign._id).select("status").lean();
      if (current?.status === "queued") {
        await Campaign.updateOne(
          { _id: campaign._id, status: "queued" },
          { $set: { status: "scheduled" } },
        );
      }
    }
  }

  return dispatched;
}
