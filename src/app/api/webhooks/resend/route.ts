import { NextResponse } from "next/server";
import { Resend } from "resend";
import { connectDB } from "@/lib/db/client";
import { getEnv } from "@/config/env";
import {
  processWebhook,
  type ResendWebhookPayload,
} from "@/modules/webhooks/process";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const webhookSecret = getEnv().RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Webhook secret is not configured" },
      { status: 503 },
    );
  }

  const rawBody = await request.text();
  const eventId = request.headers.get("svix-id") ?? "";
  const timestamp = request.headers.get("svix-timestamp") ?? "";
  const signature = request.headers.get("svix-signature") ?? "";

  let payload: ResendWebhookPayload;
  try {
    payload = new Resend().webhooks.verify({
      payload: rawBody,
      headers: { id: eventId, timestamp, signature },
      webhookSecret,
    }) as unknown as ResendWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  await connectDB();
  await processWebhook(eventId, payload);
  return NextResponse.json({ ok: true });
}
