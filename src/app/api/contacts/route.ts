import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { Contact, CONTACT_STATUSES } from "@/models/Contact";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createContactSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(CONTACT_STATUSES).optional(),
});

export async function GET(request: Request) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const status = url.searchParams.get("status");
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit = 20;

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.email = { $regex: escapeRegex(q), $options: "i" };
  }
  if (status && CONTACT_STATUSES.includes(status as never)) {
    filter.status = status;
  }

  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Contact.countDocuments(filter),
  ]);

  return NextResponse.json({
    contacts: contacts.map(serializeContact),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
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

  const parsed = createContactSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const existing = await Contact.findOne({ email: parsed.data.email }).lean();
  if (existing) {
    return NextResponse.json(
      { error: "A contact with this email already exists" },
      { status: 409 },
    );
  }

  const contact = await Contact.create({
    email: parsed.data.email,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    tags: parsed.data.tags ?? [],
    status: parsed.data.status ?? "subscribed",
  });

  return NextResponse.json(
    { contact: serializeContact(contact.toObject()) },
    { status: 201 },
  );
}

function serializeContact(contact: {
  _id: { toString(): string };
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  tags: string[];
  createdAt: Date;
}) {
  return {
    id: contact._id.toString(),
    email: contact.email,
    firstName: contact.firstName ?? null,
    lastName: contact.lastName ?? null,
    status: contact.status,
    tags: contact.tags,
    createdAt: contact.createdAt.toISOString(),
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
