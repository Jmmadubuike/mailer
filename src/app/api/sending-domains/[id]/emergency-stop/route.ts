import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { setEmergencyStop } from "@/modules/sending-domains/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ enabled: z.boolean() });

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const auth = await authorizeApi("owner");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const domain = await setEmergencyStop(id, parsed.data.enabled, {
      id: auth.session.sub,
      email: auth.session.email,
    });
    return NextResponse.json({ domain });
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
