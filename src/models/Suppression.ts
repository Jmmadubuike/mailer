import mongoose, { Schema, model, models, type Model } from "mongoose";

export const SUPPRESSION_TYPES = [
  "unsubscribe",
  "complaint",
  "bounce",
] as const;

export type SuppressionType = (typeof SUPPRESSION_TYPES)[number];

export interface ISuppression {
  _id: mongoose.Types.ObjectId;
  email: string;
  type: SuppressionType;
  scope: "all" | "list";
  listId?: mongoose.Types.ObjectId;
  reason?: string;
  createdAt: Date;
}

const suppressionSchema = new Schema<ISuppression>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    type: {
      type: String,
      enum: SUPPRESSION_TYPES,
      required: true,
    },
    scope: { type: String, enum: ["all", "list"], default: "all" },
    listId: { type: Schema.Types.ObjectId, ref: "MailingList" },
    reason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

suppressionSchema.index({ email: 1 });
suppressionSchema.index({ email: 1, scope: 1, listId: 1 }, { unique: true });

export const Suppression: Model<ISuppression> =
  (models.Suppression as Model<ISuppression>) ??
  model<ISuppression>("Suppression", suppressionSchema);
