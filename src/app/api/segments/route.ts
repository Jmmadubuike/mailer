import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import {
  createSegment,
  estimateSegment,
  listSegments,
} from "@/modules/segments/service";
import type { SegmentGroup } from "@/modules/segments/evaluate";
import { z } from "zod";

export const dynamic = "force-dynamic";

const conditionSchema = z.object({
  field: z.string().min(1),
  operator: z.string().min(1),
  value: z.unknown().optional(),
});

const groupSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    combinator: z.enum(["and", "or"]),
    children: z.array(z.union([conditionSchema, groupSchema])),
  }),
);

const createSegmentSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  root: groupSchema,
});

const estimateSchema = z.object({ root: groupSchema });

export async function GET() {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const segments = await listSegments();
  return NextResponse.json({
    segments: segments.map((segment) => ({
      id: segment._id.toString(),
      name: segment.name,
      description: segment.description ?? null,
      root: segment.root,
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

  const parsed = createSegmentSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const segment = await createSegment({
    name: parsed.data.name,
    description: parsed.data.description,
    root: parsed.data.root as SegmentGroup,
  });
  return NextResponse.json(
    {
      segment: {
        id: segment._id.toString(),
        name: segment.name,
        description: segment.description ?? null,
        root: segment.root,
      },
    },
    { status: 201 },
  );
}

export async function PUT(request: Request) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const parsed = estimateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid segment" }, { status: 400 });
  }

  const count = await estimateSegment(parsed.data.root as SegmentGroup);
  return NextResponse.json({ count });
}
