import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { AppError } from "@/lib/errors";
import {
  deleteCampaign,
  rescheduleCampaign,
} from "@/modules/campaigns/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(1).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const campaign = await rescheduleCampaign(id, parsed.data, {
      id: auth.session.sub,
      email: auth.session.email,
    });
    return NextResponse.json({
      campaign: {
        id: campaign._id.toString(),
        name: campaign.name,
        status: campaign.status,
        scheduledAt: campaign.scheduledAt?.toISOString() ?? null,
      },
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

export async function DELETE(_request: Request, context: Context) {
  const auth = await authorizeApi("owner", "administrator");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  try {
    await deleteCampaign(id, {
      id: auth.session.sub,
      email: auth.session.email,
    });
    return NextResponse.json({ ok: true });
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
