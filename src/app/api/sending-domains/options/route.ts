import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { getSendableOptions } from "@/modules/sending-domains/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const domains = await getSendableOptions();
  return NextResponse.json({ domains });
}
