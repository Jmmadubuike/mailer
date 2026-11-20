import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { AuditLog } from "@/models/AuditLog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeApi("owner", "administrator");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = 50;

  const [logs, total] = await Promise.all([
    AuditLog.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(),
  ]);

  return NextResponse.json({
    logs: logs.map((log) => ({
      id: log._id.toString(),
      actorEmail: log.actorEmail,
      action: log.action,
      targetType: log.targetType ?? null,
      targetId: log.targetId ?? null,
      meta: log.meta ?? null,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}
