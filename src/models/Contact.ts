import mongoose, { Schema, model, models, type Model } from "mongoose";

export const CONTACT_STATUSES = [
  "subscribed",
  "unsubscribed",
  "suppressed",
] as const;

export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export interface IContact {
  _id: mongoose.Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  status: ContactStatus;
  tags: string[];
  customFields?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    status: {
      type: String,
      enum: CONTACT_STATUSES,
      default: "subscribed",
      index: true,
    },
    tags: { type: [String], default: [], index: true },
    customFields: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const Contact: Model<IContact> =
  (models.Contact as Model<IContact>) ??
  model<IContact>("Contact", contactSchema);
