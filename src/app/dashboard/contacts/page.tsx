import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { Contact } from "@/models/Contact";
import {
  ContactsManager,
  type ContactDTO,
} from "@/components/contacts/contacts-manager";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  await requireRole(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  await connectDB();

  const [contacts, total] = await Promise.all([
    Contact.find().sort({ createdAt: -1 }).limit(20).lean(),
    Contact.countDocuments(),
  ]);

  const initialContacts: ContactDTO[] = contacts.map((contact) => ({
    id: contact._id.toString(),
    email: contact.email,
    firstName: contact.firstName ?? null,
    lastName: contact.lastName ?? null,
    status: contact.status,
    tags: contact.tags,
    createdAt: contact.createdAt.toISOString(),
  }));

  return (
    <ContactsManager initialContacts={initialContacts} initialTotal={total} />
  );
}
