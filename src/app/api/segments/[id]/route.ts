import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { deleteSegment, updateSegment } from "@/modules/segments/service";
import type { SegmentGroup } from "@/modules/segments/evaluate";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  root: z.unknown().optional(),
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
  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const segment = await updateSegment(id, {
    name: parsed.data.name,
    description: parsed.data.description,
    root: parsed.data.root as SegmentGroup | undefined,
  });
  return NextResponse.json({
    segment: {
      id: segment._id.toString(),
      name: segment.name,
      description: segment.description ?? null,
      root: segment.root,
    },
  });
}

export async function DELETE(_request: Request, context: Context) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  await deleteSegment(id);
  return NextResponse.json({ ok: true });
}
