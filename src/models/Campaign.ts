import mongoose, { Schema, model, models, type Model } from "mongoose";

export const CAMPAIGN_STATUSES = [
  "draft",
  "preparing",
  "scheduled",
  "queued",
  "sending",
  "sent",
  "partially_failed",
  "failed",
  "cancelled",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export interface ICampaign {
  _id: mongoose.Types.ObjectId;
  name: string;
  subject: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  previewText?: string;
  htmlContent?: string;
  textContent?: string;
  sendingDomainId: mongoose.Types.ObjectId;
  status: CampaignStatus;
  selectedLists: mongoose.Types.ObjectId[];
  selectedSegments: mongoose.Types.ObjectId[];
  recipientCount: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    fromName: { type: String, required: true, trim: true },
    fromEmail: { type: String, required: true, lowercase: true, trim: true },
    replyTo: { type: String, lowercase: true, trim: true },
    previewText: { type: String, trim: true },
    htmlContent: { type: String },
    textContent: { type: String },
    sendingDomainId: {
      type: Schema.Types.ObjectId,
      ref: "SendingDomain",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: CAMPAIGN_STATUSES,
      default: "draft",
      index: true,
    },
    selectedLists: [{ type: Schema.Types.ObjectId, ref: "MailingList" }],
    selectedSegments: [{ type: Schema.Types.ObjectId, ref: "Segment" }],
    recipientCount: { type: Number, default: 0 },
    scheduledAt: { type: Date, index: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

export const Campaign: Model<ICampaign> =
  (models.Campaign as Model<ICampaign>) ??
  model<ICampaign>("Campaign", campaignSchema);
