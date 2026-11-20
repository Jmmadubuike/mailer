import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { Contact } from "@/models/Contact";
import { ListMembership } from "@/models/ListMembership";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  ids: z.array(z.string()).min(1, "Select at least one contact"),
});

export async function POST(request: Request) {
  const auth = await authorizeApi("owner", "administrator");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  await ListMembership.deleteMany({
    contactId: { $in: parsed.data.ids },
  });
  const result = await Contact.deleteMany({ _id: { $in: parsed.data.ids } });
  return NextResponse.json({ deleted: result.deletedCount ?? 0 });
}
