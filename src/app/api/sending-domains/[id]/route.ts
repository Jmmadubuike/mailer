import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { updateSendingDomainSchema } from "@/modules/sending-domains/validation";
import {
  getDomain,
  updateDomain,
} from "@/modules/sending-domains/service";

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
    const domain = await getDomain(id);
    return NextResponse.json({ domain });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  const auth = await authorizeApi("owner");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const parsed = updateSendingDomainSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const domain = await updateDomain(id, parsed.data, {
      id: auth.session.sub,
      email: auth.session.email,
    });
    return NextResponse.json({ domain });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Unexpected error in sending-domains/[id]", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 },
  );
}
