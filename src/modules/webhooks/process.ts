import "server-only";
import { WebhookEvent } from "@/models/WebhookEvent";
import { CampaignRecipient, type ICampaignRecipient } from "@/models/CampaignRecipient";
import { SendingDomain } from "@/models/SendingDomain";
import { Suppression } from "@/models/Suppression";
import { RANK } from "@/modules/webhooks/status";

export interface ResendWebhookPayload {
  type?: string;
  data?: Record<string, unknown>;
}

export async function processWebhook(
  eventId: string,
  payload: ResendWebhookPayload,
): Promise<{ handled: boolean }> {
  const existing = await WebhookEvent.findOne({ eventId }).lean();
  if (existing) {
    if (!existing.processedAt) {
      await WebhookEvent.updateOne(
        { eventId },
        { $set: { processedAt: new Date() } },
      );
    }
    return { handled: false };
  }

  const created = await WebhookEvent.create({
    eventId,
    type: payload.type ?? "unknown",
    payload: payload as Record<string, unknown>,
  });

  if (payload.type === "domain.updated") {
    await handleDomainUpdated(payload.data);
  } else if (payload.type?.startsWith("email.")) {
    const emailId =
      typeof payload.data?.email_id === "string" ? payload.data.email_id : null;
    if (emailId) {
      const recipient = await CampaignRecipient.findOne({
        providerMessageId: emailId,
      });
      if (recipient) {
        await applyEmailEvent(recipient, payload.type, payload.data ?? {});
      }
    }
  }

  await WebhookEvent.updateOne(
    { _id: created._id },
    { $set: { processedAt: new Date() } },
  );
  return { handled: true };
}

async function applyEmailEvent(
  recipient: ICampaignRecipient,
  type: string,
  data: Record<string, unknown>,
): Promise<void> {
  const event = emailEventFromType(type);
  if (!event) return;

  await CampaignRecipient.updateOne(
    { _id: recipient._id },
    buildEventPipeline(event),
  );

  if (event === "bounced") {
    await upsertSuppression(recipient.email, "bounce");
  }
  if (event === "complained") {
    await upsertSuppression(recipient.email, "complaint");
  }

  void data;
}

function rankExpression(): Record<string, unknown> {
  return {
    $switch: {
      branches: Object.entries(RANK).map(([status, rank]) => ({
        case: { $eq: ["$status", status] },
        then: rank,
      })),
      default: -1,
    },
  };
}

function statusExpression(event: string): unknown {
  const terminal: Record<string, string> = {
    bounced: "bounced",
    complained: "complained",
    unsubscribed: "unsubscribed",
    failed: "failed",
    suppressed: "suppressed",
  };
  if (terminal[event]) return terminal[event];
  if (event === "sent") {
    return { $cond: [{ $eq: ["$status", "pending"] }, "sent", "$status"] };
  }
  const monotonic: Record<string, string> = {
    delivered: "delivered",
    opened: "opened",
    clicked: "clicked",
  };
  if (monotonic[event]) {
    return {
      $cond: [
        { $lt: [rankExpression(), RANK[monotonic[event]]] },
        monotonic[event],
        "$status",
      ],
    };
  }
  return null;
}

function buildEventPipeline(event: string): Record<string, unknown>[] {
  const now = new Date();
  const set: Record<string, unknown> = {
    events: { $setUnion: [{ $ifNull: ["$events", []] }, [event]] },
  };
  if (event === "opened") {
    set.openCount = { $add: [{ $ifNull: ["$openCount", 0] }, 1] };
    set.openedAt = { $ifNull: ["$openedAt", now] };
  }
  if (event === "clicked") {
    set.clickCount = { $add: [{ $ifNull: ["$clickCount", 0] }, 1] };
    set.clickedAt = { $ifNull: ["$clickedAt", now] };
  }
  const status = statusExpression(event);
  if (status !== null) set.status = status;
  return [{ $set: set }];
}

function emailEventFromType(type: string): string | null {
  const mapping: Record<string, string> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.opened": "opened",
    "email.clicked": "clicked",
    "email.delivery_delayed": "delivery_delayed",
    "email.failed": "failed",
  };
  return mapping[type] ?? null;
}

async function upsertSuppression(
  email: string,
  type: "bounce" | "complaint",
): Promise<void> {
  await Suppression.findOneAndUpdate(
    { email, type, scope: "all" },
    { $set: { email, type, scope: "all" } },
    { upsert: true },
  );
}

async function handleDomainUpdated(data?: Record<string, unknown>): Promise<void> {
  const providerDomainId =
    typeof data?.id === "string" ? data.id : null;
  const status = typeof data?.status === "string" ? data.status : null;
  if (!providerDomainId || !status) return;

  await SendingDomain.updateOne(
    { providerDomainId },
    {
      $set: {
        verificationStatus: status,
        lastVerifiedAt: new Date(),
      },
    },
  );
}
