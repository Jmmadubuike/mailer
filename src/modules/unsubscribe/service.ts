import "server-only";
import { CampaignRecipient } from "@/models/CampaignRecipient";
import { Contact } from "@/models/Contact";
import { Suppression } from "@/models/Suppression";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";

export async function unsubscribeRecipient(
  recipientId: string,
): Promise<{ email: string }> {
  const recipient = await CampaignRecipient.findById(recipientId);
  if (!recipient) {
    throw new AppError("This unsubscribe link is no longer valid", 404);
  }

  await Suppression.findOneAndUpdate(
    { email: recipient.email, type: "unsubscribe", scope: "all" },
    {
      $set: {
        email: recipient.email,
        type: "unsubscribe",
        scope: "all",
        reason: "recipient opted out via unsubscribe link",
      },
    },
    { upsert: true },
  );

  await Contact.findOneAndUpdate(
    { email: recipient.email },
    { $set: { status: "unsubscribed" } },
  );

  recipient.status = "unsubscribed";
  recipient.events = recipient.events.includes("unsubscribed")
    ? recipient.events
    : [...recipient.events, "unsubscribed"];
  await recipient.save();

  await logAudit({
    actorEmail: recipient.email,
    action: "contact.unsubscribed",
    targetType: "Contact",
    meta: { email: recipient.email, recipientId },
  });

  return { email: recipient.email };
}
