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
import { SendingDomain } from "@/models/SendingDomain";
import { assertSendableDomain } from "@/modules/sending-domains/service";
import { sendThroughDomain } from "@/lib/resend/send";
import { renderTemplate } from "@/modules/personalization/render";
import { createUnsubscribeToken } from "@/modules/unsubscribe/token";
import { sanitizeEmailHtml } from "@/lib/security/sanitize";
import { assertSendingEnabled } from "@/modules/settings/service";
import { htmlToText } from "@/lib/email/html-to-text";

const LEASE_MS = 5 * 60 * 1000;

export interface QueueRunResult {
  processed: number;
  sent: number;
  failed: number;
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
  const jobs = await claimJobs(limit);
  let sent = 0;
  let failed = 0;
  const affectedCampaigns = new Set<string>();

  for (const job of jobs) {
    affectedCampaigns.add(job.campaignId.toString());
    const outcome = await processJob(job);
    if (outcome === "sent") sent += 1;
    if (outcome === "failed") failed += 1;
  }

  for (const campaignId of affectedCampaigns) {
    await finalizeCampaign(campaignId);
  }

  return { processed: jobs.length, sent, failed };
}

async function finalizeCampaign(campaignId: string): Promise<void> {
  const campaign = await Campaign.findById(campaignId).select("status").lean();
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
    if (current && ["sent", "partially_failed"].includes(current.status)) {
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
    const message = error instanceof Error ? error.message : "Domain not sendable";
    await failJob(job, recipient, message, "permanent");
    return "failed";
  }

  try {
    await assertSendingEnabled();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sending is disabled";
    await failJob(job, recipient, message, "retryable");
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
  );

  const result = await sendThroughDomain({
    domainId,
    to: recipient.email,
    subject: renderTemplate(campaign.subject, context, {}, { html: false }),
    html: renderedHtml,
    text: campaign.textContent
      ? renderTemplate(campaign.textContent, context, {}, { html: false })
      : htmlToText(renderedHtml),
    fromName: campaign.fromName,
    fromEmail: campaign.fromEmail,
    replyTo: campaign.replyTo,
    headers: {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (result.ok) {
    recipient.providerMessageId = result.messageId;
    recipient.status = "sent";
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

  const errorMessage = result.error ?? "Delivery failed";
  const classification = classifyError(errorMessage);
  const attempts = job.attempts + 1;

  if (classification === "retryable" && attempts < job.maxAttempts) {
    await DeliveryJob.updateOne(
      { _id: job._id },
      {
        $set: {
          status: "retry_pending",
          attempts,
          errorClass: "retryable",
          lastError: errorMessage,
          nextRetryAt: new Date(Date.now() + backoffMs(attempts)),
        },
      },
    );
    return "failed";
  }

  await failJob(job, recipient, errorMessage, classification);
  await markDomainCredentialInvalid(domainId, errorMessage);
  return "failed";
}

async function failJob(
  job: IDeliveryJob,
  recipient: ICampaignRecipient,
  message: string,
  classification: "permanent" | "retryable",
): Promise<void> {
  await DeliveryJob.updateOne(
    { _id: job._id },
    {
      $set: {
        status: "failed",
        errorClass: classification,
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

function classifyError(message: string): "permanent" | "retryable" {
  const lower = message.toLowerCase();
  const permanentMarkers = [
    "401",
    "403",
    "404",
    "invalid api key",
    "unauthorized",
    "forbidden",
    "domain not verified",
    "not verified",
    "not allowed",
    "validation",
    "invalid sender",
    "from address",
  ];
  const retryableMarkers = [
    "429",
    "rate limit",
    "too many",
    "timeout",
    "timed out",
    "econn",
    "etimedout",
    "network",
    "service unavailable",
    "503",
    "502",
    "500",
  ];

  if (permanentMarkers.some((marker) => lower.includes(marker))) {
    return "permanent";
  }
  if (retryableMarkers.some((marker) => lower.includes(marker))) {
    return "retryable";
  }
  return "retryable";
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
