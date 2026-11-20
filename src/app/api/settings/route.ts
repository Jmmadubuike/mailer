import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import {
  getSettings,
  updateSettings,
} from "@/modules/settings/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  globalKillSwitch: z.boolean().optional(),
  dailySendLimit: z.coerce.number().int().min(0).optional(),
  testMode: z.boolean().optional(),
});

export async function GET() {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  return NextResponse.json({ settings: await getSettings() });
}

export async function PATCH(request: Request) {
  const auth = await authorizeApi("owner");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  return NextResponse.json({ settings: await updateSettings(parsed.data) });
}
