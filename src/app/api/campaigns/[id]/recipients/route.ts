import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { listCampaignRecipients } from "@/modules/campaigns/report";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const recipients = await listCampaignRecipients(id);
  return NextResponse.json({
    recipients: recipients.map((recipient) => ({
      id: recipient._id.toString(),
      email: recipient.email,
      status: recipient.status,
      providerMessageId: recipient.providerMessageId ?? null,
      error: recipient.error ?? null,
      events: recipient.events,
      openedAt: recipient.openedAt?.toISOString() ?? null,
      clickedAt: recipient.clickedAt?.toISOString() ?? null,
    })),
  });
}
