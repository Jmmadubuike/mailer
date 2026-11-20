import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { Suppression } from "@/models/Suppression";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = 50;

  const [suppressions, total] = await Promise.all([
    Suppression.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Suppression.countDocuments(),
  ]);

  return NextResponse.json({
    suppressions: suppressions.map((suppression) => ({
      id: suppression._id.toString(),
      email: suppression.email,
      type: suppression.type,
      scope: suppression.scope,
      reason: suppression.reason ?? null,
      createdAt: suppression.createdAt.toISOString(),
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}
