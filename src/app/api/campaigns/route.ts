import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { createCampaignSchema } from "@/modules/campaigns/validation";
import {
  createCampaign,
  listCampaigns,
} from "@/modules/campaigns/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const campaigns = await listCampaigns();
  return NextResponse.json({
    campaigns: campaigns.map((campaign) => ({
      id: campaign._id.toString(),
      name: campaign.name,
      subject: campaign.subject,
      fromName: campaign.fromName,
      fromEmail: campaign.fromEmail,
      sendingDomainId: campaign.sendingDomainId.toString(),
      status: campaign.status,
      recipientCount: campaign.recipientCount,
      scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const parsed = createCampaignSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const campaign = await createCampaign(parsed.data, {
      id: auth.session.sub,
      email: auth.session.email,
    });
    return NextResponse.json(
      {
        campaign: {
          id: campaign._id.toString(),
          name: campaign.name,
          subject: campaign.subject,
          fromName: campaign.fromName,
          fromEmail: campaign.fromEmail,
          sendingDomainId: campaign.sendingDomainId.toString(),
          status: campaign.status,
          recipientCount: campaign.recipientCount,
          scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Unexpected error creating campaign", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
