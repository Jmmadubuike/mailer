import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { getDomainStats } from "@/modules/sending-domains/service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const auth = await authorizeApi("owner", "administrator", "campaign_manager");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const stats = await getDomainStats(id);
  return NextResponse.json({ stats });
}
