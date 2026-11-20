import mongoose, { Schema, model, models, type Model } from "mongoose";

export interface IAuditLog {
  _id: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  actorEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    targetType: { type: String, index: true },
    targetId: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  (models.AuditLog as Model<IAuditLog>) ??
  model<IAuditLog>("AuditLog", auditLogSchema);
