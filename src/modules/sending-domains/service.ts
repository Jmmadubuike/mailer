import "server-only";
import mongoose from "mongoose";
import {
  SendingDomain,
  type ISendingDomain,
  type DomainVerificationStatus,
} from "@/models/SendingDomain";
import { CampaignRecipient } from "@/models/CampaignRecipient";
import {
  encryptSecret,
  maskApiKey,
} from "@/lib/security/crypto";
import {
  getOrCreateProviderDomain,
  getProviderDomain,
  verifyProviderDomain,
} from "@/lib/resend/domains";
import { logAudit } from "@/lib/audit";
import { AppError } from "@/lib/errors";
import type {
  DomainStats,
  SendableDomainOption,
  SendingDomainDTO,
} from "@/types/sending-domain";

function serialize(domain: ISendingDomain): SendingDomainDTO {
  return {
    id: domain._id.toString(),
    name: domain.name,
    domain: domain.domain,
    providerDomainId: domain.providerDomainId,
    apiKeyHint: domain.apiKeyHint,
    permission: domain.permission,
    restrictedToDomain: domain.restrictedToDomain,
    verificationStatus: domain.verificationStatus,
    isActive: domain.isActive,
    emergencyKillSwitch: domain.emergencyKillSwitch,
    defaultSenderName: domain.defaultSenderName,
    defaultSenderAddress: domain.defaultSenderAddress,
    defaultReplyTo: domain.defaultReplyTo,
    credentialStatus: domain.credentialStatus,
    lastTestedAt: domain.lastTestedAt?.toISOString(),
    lastVerifiedAt: domain.lastVerifiedAt?.toISOString(),
    dnsRecords: domain.dnsRecords ?? [],
    createdAt: domain.createdAt.toISOString(),
    updatedAt: domain.updatedAt.toISOString(),
  };
}

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function emailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

interface Actor {
  id: string;
  email: string;
}

export async function listDomains(): Promise<SendingDomainDTO[]> {
  const domains = await SendingDomain.find().sort({ createdAt: -1 }).lean();
  return domains.map(serialize);
}

export async function getDomain(id: string): Promise<SendingDomainDTO> {
  const domain = await findDomainOrThrow(id);
  return serialize(domain);
}

export async function createDomain(
  input: {
    name: string;
    domain: string;
    apiKey?: string;
    defaultSenderName?: string;
    defaultSenderAddress?: string;
    defaultReplyTo?: string;
  },
  actor: Actor,
): Promise<SendingDomainDTO> {
  const domainName = normalizeDomain(input.domain);

  const existing = await SendingDomain.findOne({ domain: domainName }).lean();
  if (existing) {
    throw new AppError(`Domain "${domainName}" is already registered`, 409);
  }

  // Register with Resend to obtain the provider id and DNS records.
  const provider = await getOrCreateProviderDomain(domainName);

  const record: Partial<ISendingDomain> = {
    name: input.name.trim(),
    domain: domainName,
    providerDomainId: provider.id,
    verificationStatus: mapProviderStatus(provider.status),
    defaultSenderName: input.defaultSenderName?.trim() || undefined,
    defaultSenderAddress: input.defaultSenderAddress || undefined,
    defaultReplyTo: input.defaultReplyTo || undefined,
    dnsRecords: (provider.records ?? []) as ISendingDomain["dnsRecords"],
  };

  if (input.apiKey) {
    applyApiKey(record, input.apiKey);
  }

  const created = await SendingDomain.create(record);
  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "sending_domain.created",
    targetType: "SendingDomain",
    targetId: created._id.toString(),
    meta: { domain: domainName },
  });

  return serialize(created.toObject());
}

export async function updateDomain(
  id: string,
  input: {
    name?: string;
    apiKey?: string;
    defaultSenderName?: string;
    defaultSenderAddress?: string;
    defaultReplyTo?: string;
  },
  actor: Actor,
): Promise<SendingDomainDTO> {
  const domain = await SendingDomain.findById(id);
  if (!domain) throw new AppError("Sending domain not found", 404);

  if (input.name !== undefined) domain.name = input.name.trim();
  if (input.defaultSenderName !== undefined)
    domain.defaultSenderName = input.defaultSenderName.trim() || undefined;
  if (input.defaultSenderAddress !== undefined)
    domain.defaultSenderAddress = input.defaultSenderAddress || undefined;
  if (input.defaultReplyTo !== undefined)
    domain.defaultReplyTo = input.defaultReplyTo || undefined;

  if (input.apiKey) {
    applyApiKey(domain, input.apiKey);
    domain.credentialStatus = "unknown";
  }

  await domain.save();
  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "sending_domain.updated",
    targetType: "SendingDomain",
    targetId: id,
  });

  return serialize(domain.toObject());
}

export async function activateDomain(id: string, actor: Actor): Promise<SendingDomainDTO> {
  const domain = await SendingDomain.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true },
  );
  if (!domain) throw new AppError("Sending domain not found", 404);
  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "sending_domain.activated",
    targetType: "SendingDomain",
    targetId: id,
  });
  return serialize(domain.toObject());
}

export async function deactivateDomain(id: string, actor: Actor): Promise<SendingDomainDTO> {
  const domain = await SendingDomain.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true },
  );
  if (!domain) throw new AppError("Sending domain not found", 404);
  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "sending_domain.deactivated",
    targetType: "SendingDomain",
    targetId: id,
  });
  return serialize(domain.toObject());
}

export async function setEmergencyStop(
  id: string,
  enabled: boolean,
  actor: Actor,
): Promise<SendingDomainDTO> {
  const domain = await SendingDomain.findByIdAndUpdate(
    id,
    { emergencyKillSwitch: enabled },
    { new: true },
  );
  if (!domain) throw new AppError("Sending domain not found", 404);
  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: enabled
      ? "sending_domain.emergency_stopped"
      : "sending_domain.emergency_stop_cleared",
    targetType: "SendingDomain",
    targetId: id,
  });
  return serialize(domain.toObject());
}

export async function triggerVerification(
  id: string,
  actor: Actor,
): Promise<SendingDomainDTO> {
  const domain = await findDomainOrThrow(id);
  if (!domain.providerDomainId) {
    throw new AppError("Domain has not been registered with the provider yet", 409);
  }

  await verifyProviderDomain(domain.providerDomainId);
  const status = await refreshVerificationStatus(id);
  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "sending_domain.verification_triggered",
    targetType: "SendingDomain",
    targetId: id,
    meta: { status },
  });
  return getDomain(id);
}

export async function refreshVerificationStatus(id: string): Promise<DomainVerificationStatus> {
  const domain = await findDomainOrThrow(id);
  if (!domain.providerDomainId) return domain.verificationStatus;

  const provider = await getProviderDomain(domain.providerDomainId);
  const status = mapProviderStatus(provider.status);

  await SendingDomain.findByIdAndUpdate(id, {
    verificationStatus: status,
    lastVerifiedAt: new Date(),
  });
  return status;
}

export async function getSendableOptions(): Promise<SendableDomainOption[]> {
  const domains = await SendingDomain.find({
    isActive: true,
    emergencyKillSwitch: { $ne: true },
    verificationStatus: "verified",
    credentialStatus: { $in: ["ok", "unknown"] },
  })
    .sort({ name: 1 })
    .lean();

  return domains.map((domain) => ({
    id: domain._id.toString(),
    name: domain.name,
    domain: domain.domain,
    defaultSenderName: domain.defaultSenderName,
    defaultSenderAddress: domain.defaultSenderAddress,
    defaultReplyTo: domain.defaultReplyTo,
  }));
}

export async function assertSendableDomain(
  id: string,
  fromEmail?: string,
): Promise<ISendingDomain> {
  const domain = await SendingDomain.findById(id).lean();
  if (!domain) throw new AppError("Sending domain not found", 404);
  if (!domain.isActive) throw new AppError("This sending domain is inactive", 409);
  if (domain.emergencyKillSwitch)
    throw new AppError("Sending is disabled for this domain (emergency stop)", 409);
  if (domain.verificationStatus !== "verified")
    throw new AppError("This sending domain is not verified", 409);
  if (domain.credentialStatus === "invalid" || domain.credentialStatus === "revoked")
    throw new AppError("This domain's API credentials are invalid", 409);

  if (fromEmail && emailDomain(fromEmail) !== domain.domain) {
    throw new AppError(
      `Sender email must belong to the selected domain (${domain.domain})`,
      400,
    );
  }

  return domain;
}

export async function getDomainStats(domainId?: string): Promise<DomainStats> {
  const match =
    domainId && mongoose.isValidObjectId(domainId)
      ? { sendingDomainId: new mongoose.Types.ObjectId(domainId) }
      : {};

  const [result] = await CampaignRecipient.aggregate<{
    total: Array<{ count: number }>;
    accepted: Array<{ count: number }>;
    delivered: Array<{ count: number }>;
    bounced: Array<{ count: number }>;
    complained: Array<{ count: number }>;
    opened: Array<{ count: number }>;
    clicked: Array<{ count: number }>;
    unsubscribed: Array<{ count: number }>;
    failed: Array<{ count: number }>;
    totalOpens: Array<{ count: number }>;
    totalClicks: Array<{ count: number }>;
  }>([
    ...(domainId && mongoose.isValidObjectId(domainId)
      ? [{ $match: match }]
      : []),
    {
      $facet: {
        total: [{ $count: "count" }],
        accepted: [
          { $match: { providerMessageId: { $type: "string" } } },
          { $count: "count" },
        ],
        delivered: [
          { $match: { events: "delivered" } },
          { $count: "count" },
        ],
        bounced: [{ $match: { events: "bounced" } }, { $count: "count" }],
        complained: [
          { $match: { events: "complained" } },
          { $count: "count" },
        ],
        opened: [{ $match: { events: "opened" } }, { $count: "count" }],
        clicked: [{ $match: { events: "clicked" } }, { $count: "count" }],
        unsubscribed: [
          { $match: { events: "unsubscribed" } },
          { $count: "count" },
        ],
        failed: [{ $match: { events: "failed" } }, { $count: "count" }],
        totalOpens: [
          { $group: { _id: null, count: { $sum: "$openCount" } } },
        ],
        totalClicks: [
          { $group: { _id: null, count: { $sum: "$clickCount" } } },
        ],
      },
    },
  ]);

  const total = result?.total[0]?.count ?? 0;
  const sent = result?.accepted[0]?.count ?? 0;
  const delivered = result?.delivered[0]?.count ?? 0;
  const bounced = result?.bounced[0]?.count ?? 0;
  const complaints = result?.complained[0]?.count ?? 0;
  const opens = result?.opened[0]?.count ?? 0;
  const clicks = result?.clicked[0]?.count ?? 0;
  const unsubscribes = result?.unsubscribed[0]?.count ?? 0;
  const failed = result?.failed[0]?.count ?? 0;
  const totalOpens = result?.totalOpens[0]?.count ?? 0;
  const totalClicks = result?.totalClicks[0]?.count ?? 0;

  const domain = domainId ? await SendingDomain.findById(domainId).lean() : null;

  const rate = (numerator: number, denominator: number) =>
    denominator > 0 ? Number((numerator / denominator).toFixed(4)) : 0;

  return {
    domainId: domain?._id.toString() ?? null,
    domainName: domain?.name ?? null,
    totalRecipients: total,
    sent,
    delivered,
    bounced,
    complaints,
    opens,
    clicks,
    totalOpens,
    totalClicks,
    unsubscribes,
    failed,
    deliveryRate: rate(delivered, sent),
    bounceRate: rate(bounced, sent),
    openRate: rate(opens, delivered),
    clickRate: rate(clicks, delivered),
    complaintRate: rate(complaints, delivered),
    unsubscribeRate: rate(unsubscribes, delivered),
  };
}

async function findDomainOrThrow(id: string): Promise<ISendingDomain> {
  const domain = await SendingDomain.findById(id).lean();
  if (!domain) throw new AppError("Sending domain not found", 404);
  return domain;
}

function applyApiKey(
  record: Partial<ISendingDomain>,
  apiKey: string,
): void {
  const blob = encryptSecret(apiKey);
  record.apiKeyEnc = blob.ciphertext;
  record.apiKeyIv = blob.iv;
  record.apiKeyAuthTag = blob.authTag;
  record.apiKeyHint = maskApiKey(apiKey);
  record.kekVersion = "v1";
}

function mapProviderStatus(status: string): DomainVerificationStatus {
  const normalized = status.toLowerCase();
  const allowed: DomainVerificationStatus[] = [
    "not_started",
    "pending",
    "verified",
    "partially_verified",
    "partially_failed",
    "failed",
  ];
  return allowed.includes(normalized as DomainVerificationStatus)
    ? (normalized as DomainVerificationStatus)
    : "not_started";
}
