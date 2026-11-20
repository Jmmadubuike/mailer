import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { getEnv } from "@/config/env";
import { processQueue } from "@/modules/delivery/queue";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret =
    request.headers.get("x-cron-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = getEnv().CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const result = await processQueue();
  return NextResponse.json(result);
}
