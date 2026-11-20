import mongoose, { Schema, model, models, type Model } from "mongoose";

export const DELIVERY_JOB_STATUSES = [
  "pending",
  "processing",
  "sent",
  "failed",
  "retry_pending",
  "cancelled",
] as const;

export type DeliveryJobStatus = (typeof DELIVERY_JOB_STATUSES)[number];

export interface IDeliveryJob {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  sendingDomainId: mongoose.Types.ObjectId;
  status: DeliveryJobStatus;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  errorClass?: "permanent" | "retryable";
  leaseUntil?: Date;
  lockedAt?: Date;
  nextRetryAt?: Date;
  workerRunId?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const deliveryJobSchema = new Schema<IDeliveryJob>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: "CampaignRecipient",
      required: true,
      index: true,
    },
    sendingDomainId: {
      type: Schema.Types.ObjectId,
      ref: "SendingDomain",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: DELIVERY_JOB_STATUSES,
      default: "pending",
      index: true,
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    lastError: { type: String },
    errorClass: { type: String, enum: ["permanent", "retryable"] },
    leaseUntil: { type: Date },
    lockedAt: { type: Date },
    nextRetryAt: { type: Date, index: true },
    workerRunId: { type: String },
    idempotencyKey: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

deliveryJobSchema.index({ status: 1, nextRetryAt: 1 });
deliveryJobSchema.index({ status: 1, sendingDomainId: 1 });

export const DeliveryJob: Model<IDeliveryJob> =
  (models.DeliveryJob as Model<IDeliveryJob>) ??
  model<IDeliveryJob>("DeliveryJob", deliveryJobSchema);
