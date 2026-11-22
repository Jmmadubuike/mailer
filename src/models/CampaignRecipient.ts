import mongoose, { Schema, model, models, type Model } from "mongoose";

export const RECIPIENT_STATUSES = [
  "pending",
  "sent",
  "delivered",
  "bounced",
  "complained",
  "opened",
  "clicked",
  "unsubscribed",
  "failed",
  "suppressed",
] as const;

export type RecipientStatus = (typeof RECIPIENT_STATUSES)[number];

export interface ICampaignRecipient {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  contactId?: mongoose.Types.ObjectId;
  email: string;
  sendingDomainId: mongoose.Types.ObjectId;
  provider: string;
  providerMessageId?: string;
  status: RecipientStatus;
  events: string[];
  personalization?: Record<string, unknown>;
  openedAt?: Date;
  clickedAt?: Date;
  error?: string;
  sentAt?: Date;
  openCount: number;
  clickCount: number;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<ICampaignRecipient>;
}

const campaignRecipientSchema = new Schema<ICampaignRecipient>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    email: { type: String, required: true, lowercase: true, trim: true },
    sendingDomainId: {
      type: Schema.Types.ObjectId,
      ref: "SendingDomain",
      required: true,
      index: true,
    },
    provider: { type: String, default: "resend" },
    providerMessageId: { type: String, index: true, sparse: true },
    status: {
      type: String,
      enum: RECIPIENT_STATUSES,
      default: "pending",
      index: true,
    },
    events: { type: [String], default: [] },
    personalization: { type: Schema.Types.Mixed },
    openedAt: { type: Date },
    clickedAt: { type: Date },
    error: { type: String },
    sentAt: { type: Date, index: true },
    openCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

campaignRecipientSchema.index({ campaignId: 1, email: 1 }, { unique: true });

export const CampaignRecipient: Model<ICampaignRecipient> =
  (models.CampaignRecipient as Model<ICampaignRecipient>) ??
  model<ICampaignRecipient>("CampaignRecipient", campaignRecipientSchema);
