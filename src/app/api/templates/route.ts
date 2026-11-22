import { NextResponse } from "next/server";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { listTemplates } from "@/modules/templates/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;

  const templates = await listTemplates();
  return NextResponse.json({ templates });
}
