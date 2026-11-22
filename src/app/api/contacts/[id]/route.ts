import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { Contact, CONTACT_STATUSES } from "@/models/Contact";
import { ListMembership } from "@/models/ListMembership";
import { Suppression } from "@/models/Suppression";
import mongoose from "mongoose";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(CONTACT_STATUSES).optional(),
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
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const contact = await Contact.findByIdAndUpdate(
    id,
    { $set: parsed.data },
    { new: true },
  );
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  if (parsed.data.status === "unsubscribed") {
    await Suppression.findOneAndUpdate(
      { email: contact.email, type: "unsubscribe", scope: "all" },
      {
        $set: {
          email: contact.email,
          type: "unsubscribe",
          scope: "all",
          reason: "unsubscribed via dashboard",
        },
      },
      { upsert: true },
    );
  } else if (parsed.data.status === "subscribed") {
    await Suppression.deleteOne({
      email: contact.email,
      type: "unsubscribe",
      scope: "all",
    });
  }

  return NextResponse.json({
    contact: {
      id: contact._id.toString(),
      email: contact.email,
      firstName: contact.firstName ?? null,
      lastName: contact.lastName ?? null,
      status: contact.status,
      tags: contact.tags,
    },
  });
}

export async function DELETE(_request: Request, context: Context) {
  const auth = await authorizeApi("owner", "administrator");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
  const contact = await Contact.findByIdAndDelete(id);
  if (!contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  await ListMembership.deleteMany({ contactId: contact._id });
  return NextResponse.json({ ok: true });
}
