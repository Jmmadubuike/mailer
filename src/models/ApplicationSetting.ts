import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IApplicationSetting {
  _id: mongoose.Types.ObjectId;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSettingSchema = new Schema<IApplicationSetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const ApplicationSetting: Model<IApplicationSetting> =
  (models.ApplicationSetting as Model<IApplicationSetting>) ??
  model<IApplicationSetting>("ApplicationSetting", applicationSettingSchema);
