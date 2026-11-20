import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { createSendingDomainSchema } from "@/modules/sending-domains/validation";
import {
  createDomain,
  listDomains,
} from "@/modules/sending-domains/service";

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

  const domains = await listDomains();
  return NextResponse.json({ domains });
}

export async function POST(request: Request) {
  const auth = await authorizeApi("owner");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const parsed = createSendingDomainSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const domain = await createDomain(parsed.data, {
      id: auth.session.sub,
      email: auth.session.email,
    });
    return NextResponse.json({ domain }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

function handleError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Unexpected error in sending-domains", error);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 },
  );
}
