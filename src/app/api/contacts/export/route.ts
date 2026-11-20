import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { Contact } from "@/models/Contact";
import { toCsv } from "@/lib/utils/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const contacts = await Contact.find().sort({ email: 1 }).lean();
  const rows = [
    ["email", "first_name", "last_name", "status", "tags"],
    ...contacts.map((contact) => [
      contact.email,
      contact.firstName ?? "",
      contact.lastName ?? "",
      contact.status,
      contact.tags.join(";"),
    ]),
  ];

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="contacts.csv"',
    },
  });
}
