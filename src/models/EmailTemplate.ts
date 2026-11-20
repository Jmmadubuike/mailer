import mongoose, { Schema, model, models, type Model } from "mongoose";
import type { TemplateColors } from "@/lib/templates/colors";

export interface IEmailTemplate {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category?: string;
  subject: string;
  previewText?: string;
  htmlContent: string;
  textContent?: string;
  colors?: TemplateColors;
  createdAt: Date;
  updatedAt: Date;
}

const emailTemplateSchema = new Schema<IEmailTemplate>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, trim: true, index: true },
    subject: { type: String, required: true, trim: true },
    previewText: { type: String, trim: true },
    htmlContent: { type: String, required: true },
    textContent: { type: String },
    colors: {
      type: Schema.Types.Mixed,
      default: {
        primary: "#4f46e5",
        background: "#f4f5f7",
        text: "#1f2937",
      },
    },
  },
  { timestamps: true },
);

export const EmailTemplate: Model<IEmailTemplate> =
  (models.EmailTemplate as Model<IEmailTemplate>) ??
  model<IEmailTemplate>("EmailTemplate", emailTemplateSchema);
