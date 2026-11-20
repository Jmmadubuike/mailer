import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { Contact } from "@/models/Contact";
import { MailingList } from "@/models/MailingList";
import { ListMembership } from "@/models/ListMembership";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  emails: z
    .array(z.string().trim().toLowerCase().email("Invalid email in list"))
    .min(1, "Provide at least one email"),
});

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const list = await MailingList.findById(id);
  if (!list) {
    return NextResponse.json({ error: "Mailing list not found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const emails = [...new Set(parsed.data.emails)];
  const contacts = await Promise.all(
    emails.map((email) =>
      Contact.findOneAndUpdate(
        { email },
        { $setOnInsert: { email, status: "subscribed", tags: [] } },
        { upsert: true, new: true },
      ),
    ),
  );

  await ListMembership.bulkWrite(
    contacts.map((contact) => ({
      updateOne: {
        filter: { contactId: contact._id, listId: list._id },
        update: { $setOnInsert: { contactId: contact._id, listId: list._id } },
        upsert: true,
      },
    })),
  );

  return NextResponse.json({ added: contacts.length });
}
