import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { runImport } from "@/modules/imports/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  rows: z.array(z.record(z.string(), z.string())).max(10000),
  mapping: z.object({
    email: z.string().min(1),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    tags: z.string().optional(),
    customFields: z.record(z.string(), z.string()).optional(),
  }),
  duplicateMode: z.enum(["skip", "update", "new_only"]),
  confirmConsent: z.boolean(),
  listId: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  try {
    const result = await runImport(parsed.data, {
      id: auth.session.sub,
      email: auth.session.email,
    });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Import failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
