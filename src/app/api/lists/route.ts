import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { MailingList } from "@/models/MailingList";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createListSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
});

export async function GET() {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const lists = await MailingList.find().sort({ name: 1 }).lean();
  return NextResponse.json({
    lists: lists.map((list) => ({
      id: list._id.toString(),
      name: list.name,
      description: list.description ?? null,
      createdAt: list.createdAt.toISOString(),
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

  const parsed = createListSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const list = await MailingList.create(parsed.data);
  return NextResponse.json(
    {
      list: {
        id: list._id.toString(),
        name: list.name,
        description: list.description ?? null,
      },
    },
    { status: 201 },
  );
}
