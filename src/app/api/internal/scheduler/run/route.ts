import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { getEnv } from "@/config/env";
import { dispatchDueCampaigns } from "@/modules/delivery/dispatch";
import { finalizeStalledCampaigns, processQueue } from "@/modules/delivery/queue";

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
  const dispatched = await dispatchDueCampaigns();
  const processed = await processQueue();
  const finalized = await finalizeStalledCampaigns();
  return NextResponse.json({ dispatched, finalized, ...processed });
}
