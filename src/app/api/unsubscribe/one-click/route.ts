import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { getEnv } from "@/config/env";
import { verifyUnsubscribeToken } from "@/modules/unsubscribe/token";
import { unsubscribeRecipient } from "@/modules/unsubscribe/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get("token") ?? "");

  const verified = verifyUnsubscribeToken(getEnv().AUTH_SECRET, token);
  if (!verified) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await connectDB();
  try {
    await unsubscribeRecipient(verified.recipientId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unsubscribe failed" },
      { status: 404 },
    );
  }
}
