import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { listCampaignRecipients } from "@/modules/campaigns/report";
import { toCsv } from "@/lib/utils/csv";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const recipients = await listCampaignRecipients(id);
  const rows = [
    ["email", "status", "message_id", "error", "events"],
    ...recipients.map((recipient) => [
      recipient.email,
      recipient.status,
      recipient.providerMessageId ?? "",
      recipient.error ?? "",
      recipient.events.join(" "),
    ]),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="campaign-${id}.csv"`,
    },
  });
}
