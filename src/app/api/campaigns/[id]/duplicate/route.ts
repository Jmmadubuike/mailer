import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { AppError } from "@/lib/errors";
import { duplicateCampaign } from "@/modules/campaigns/service";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  try {
    const campaign = await duplicateCampaign(id, {
      id: auth.session.sub,
      email: auth.session.email,
    });
    return NextResponse.json(
      {
        campaign: {
          id: campaign._id.toString(),
          name: campaign.name,
          status: campaign.status,
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
    console.error("Unexpected error duplicating campaign", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
