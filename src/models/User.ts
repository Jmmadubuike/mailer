import mongoose, { Schema, model, models, type Model } from "mongoose";

export const USER_ROLES = [
  "owner",
  "administrator",
  "campaign_manager",
  "viewer",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface IUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "administrator",
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
  },
  { timestamps: true },
);

export const User: Model<IUser> =
  (models.User as Model<IUser>) ?? model<IUser>("User", userSchema);
