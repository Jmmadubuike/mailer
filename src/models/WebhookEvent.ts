import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IWebhookEvent {
  _id: mongoose.Types.ObjectId;
  eventId: string;
  type: string;
  payload: Record<string, unknown>;
  processedAt?: Date;
  createdAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed, required: true },
    processedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const WebhookEvent: Model<IWebhookEvent> =
  (models.WebhookEvent as Model<IWebhookEvent>) ??
  model<IWebhookEvent>("WebhookEvent", webhookEventSchema);
