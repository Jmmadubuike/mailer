import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IMailingList {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const mailingListSchema = new Schema<IMailingList>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true },
);

export const MailingList: Model<IMailingList> =
  (models.MailingList as Model<IMailingList>) ??
  model<IMailingList>("MailingList", mailingListSchema);
