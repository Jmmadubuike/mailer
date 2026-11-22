import "server-only";
import { AuditLog } from "@/models/AuditLog";
import mongoose from "mongoose";

export interface AuditInput {
  actorEmail: string;
  actorId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Record<string, unknown>;
}

export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await AuditLog.create({
      actorEmail: input.actorEmail,
      actorId:
        input.actorId && mongoose.isValidObjectId(input.actorId)
          ? input.actorId
          : undefined,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      meta: input.meta,
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}
