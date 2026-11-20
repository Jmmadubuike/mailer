import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { getEnv } from "@/config/env";
import { readJson } from "@/lib/api";
import { verifyUnsubscribeToken } from "@/modules/unsubscribe/token";
import { unsubscribeRecipient } from "@/modules/unsubscribe/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ token: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const verified = verifyUnsubscribeToken(getEnv().AUTH_SECRET, parsed.data.token);
  if (!verified) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await connectDB();
  try {
    const { email } = await unsubscribeRecipient(verified.recipientId);
    return NextResponse.json({ ok: true, email });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unsubscribe failed" },
      { status: 404 },
    );
  }
}
