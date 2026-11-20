import "server-only";
import { WebhookEvent } from "@/models/WebhookEvent";
import { CampaignRecipient, type ICampaignRecipient } from "@/models/CampaignRecipient";
import { SendingDomain } from "@/models/SendingDomain";
import { Suppression } from "@/models/Suppression";

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

  recipient.events = recipient.events.includes(event)
    ? recipient.events
    : [...recipient.events, event];

  switch (event) {
    case "sent":
      if (recipient.status === "pending") recipient.status = "sent";
      break;
    case "delivered":
      recipient.status = "delivered";
      break;
    case "bounced":
      recipient.status = "bounced";
      await upsertSuppression(recipient.email, "bounce");
      break;
    case "complained":
      recipient.status = "complained";
      await upsertSuppression(recipient.email, "complaint");
      break;
    case "opened":
      recipient.openedAt = new Date();
      if (["sent", "delivered"].includes(recipient.status)) {
        recipient.status = "opened";
      }
      break;
    case "clicked":
      recipient.clickedAt = new Date();
      recipient.status = "clicked";
      break;
    case "unsubscribed":
      recipient.status = "unsubscribed";
      break;
    case "failed":
      recipient.status = "failed";
      break;
    default:
      break;
  }

  void data;
  await recipient.save();
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
