import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { getCampaignReport } from "@/modules/campaigns/report";
import { AppError } from "@/lib/errors";

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
  try {
    const report = await getCampaignReport(id);
    return NextResponse.json({
      campaign: {
        id: report.campaign._id.toString(),
        name: report.campaign.name,
        subject: report.campaign.subject,
        status: report.campaign.status,
        fromName: report.campaign.fromName,
        fromEmail: report.campaign.fromEmail,
        sendingDomainId: report.campaign.sendingDomainId.toString(),
        recipientCount: report.campaign.recipientCount,
        scheduledAt: report.campaign.scheduledAt?.toISOString() ?? null,
        createdAt: report.campaign.createdAt.toISOString(),
      },
      stats: report.stats,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
