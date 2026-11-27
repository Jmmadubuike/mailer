import mongoose, { Schema, model, models, type Model } from "mongoose";

export const DOMAIN_VERIFICATION_STATUSES = [
  "not_started",
  "pending",
  "verified",
  "partially_verified",
  "partially_failed",
  "failed",
] as const;

export type DomainVerificationStatus =
  (typeof DOMAIN_VERIFICATION_STATUSES)[number];

export const CREDENTIAL_STATUSES = [
  "unknown",
  "ok",
  "invalid",
  "revoked",
] as const;

export type CredentialStatus = (typeof CREDENTIAL_STATUSES)[number];

export const API_KEY_PERMISSIONS = ["sending_access", "full_access"] as const;
export type ApiKeyPermission = (typeof API_KEY_PERMISSIONS)[number];

export const DMARC_STATUSES = ["unknown", "missing", "present", "invalid"] as const;
export type DmarcStatus = (typeof DMARC_STATUSES)[number];

export interface DnsRecord {
  record: string;
  name: string;
  value: string;
  type: string;
  ttl: string;
  status: string;
}

export interface ISendingDomain {
  _id: mongoose.Types.ObjectId;
  name: string;
  domain: string;
  providerDomainId?: string;
  apiKeyEnc?: string;
  apiKeyIv?: string;
  apiKeyAuthTag?: string;
  kekVersion: string;
  apiKeyHint?: string;
  permission: ApiKeyPermission;
  restrictedToDomain: boolean;
  verificationStatus: DomainVerificationStatus;
  isActive: boolean;
  emergencyKillSwitch: boolean;
  defaultSenderName?: string;
  defaultSenderAddress?: string;
  defaultReplyTo?: string;
  credentialStatus: CredentialStatus;
  dmarcStatus: DmarcStatus;
  dmarcPolicy?: string;
  lastTestedAt?: Date;
  lastVerifiedAt?: Date;
  dnsRecords: DnsRecord[];
  createdAt: Date;
  updatedAt: Date;
}

const dnsRecordSchema = new Schema<DnsRecord>(
  {
    record: { type: String },
    name: { type: String },
    value: { type: String },
    type: { type: String },
    ttl: { type: String },
    status: { type: String },
  },
  { _id: false },
);

const sendingDomainSchema = new Schema<ISendingDomain>(
  {
    name: { type: String, required: true, trim: true },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    providerDomainId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    apiKeyEnc: { type: String, select: false },
    apiKeyIv: { type: String, select: false },
    apiKeyAuthTag: { type: String, select: false },
    kekVersion: { type: String, default: "v1" },
    apiKeyHint: { type: String },
    permission: {
      type: String,
      enum: API_KEY_PERMISSIONS,
      default: "sending_access",
    },
    restrictedToDomain: { type: Boolean, default: true },
    verificationStatus: {
      type: String,
      enum: DOMAIN_VERIFICATION_STATUSES,
      default: "not_started",
    },
    isActive: { type: Boolean, default: true },
    emergencyKillSwitch: { type: Boolean, default: false },
    defaultSenderName: { type: String, trim: true },
    defaultSenderAddress: { type: String, lowercase: true, trim: true },
    defaultReplyTo: { type: String, lowercase: true, trim: true },
    credentialStatus: {
      type: String,
      enum: CREDENTIAL_STATUSES,
      default: "unknown",
    },
    dmarcStatus: {
      type: String,
      enum: DMARC_STATUSES,
      default: "unknown",
    },
    dmarcPolicy: { type: String },
    lastTestedAt: { type: Date },
    lastVerifiedAt: { type: Date },
    dnsRecords: { type: [dnsRecordSchema], default: [] },
  },
  { timestamps: true },
);

export const SendingDomain: Model<ISendingDomain> =
  (models.SendingDomain as Model<ISendingDomain>) ??
  model<ISendingDomain>("SendingDomain", sendingDomainSchema);
