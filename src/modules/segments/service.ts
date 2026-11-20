import "server-only";
import { Segment, type ISegment } from "@/models/Segment";
import { Contact } from "@/models/Contact";
import { ListMembership } from "@/models/ListMembership";
import { Suppression } from "@/models/Suppression";
import {
  evaluateSegment,
  type ContactRecord,
  type SegmentGroup,
} from "@/modules/segments/evaluate";
import { AppError } from "@/lib/errors";

export async function listSegments(): Promise<ISegment[]> {
  return Segment.find().sort({ name: 1 }).lean();
}

export async function createSegment(
  input: { name: string; description?: string; root: SegmentGroup },
): Promise<ISegment> {
  return Segment.create(input);
}

export async function updateSegment(
  id: string,
  input: { name?: string; description?: string; root?: SegmentGroup },
): Promise<ISegment> {
  const segment = await Segment.findByIdAndUpdate(id, { $set: input }, { new: true });
  if (!segment) throw new AppError("Segment not found", 404);
  return segment;
}

export async function deleteSegment(id: string): Promise<void> {
  const segment = await Segment.findByIdAndDelete(id);
  if (!segment) throw new AppError("Segment not found", 404);
}

export async function estimateSegment(root: SegmentGroup): Promise<number> {
  const suppressedEmails = new Set(
    (await Suppression.find({ scope: "all" }).lean()).map(
      (suppression) => suppression.email,
    ),
  );

  const contacts = await Contact.find({
    status: "subscribed",
    email: { $nin: [...suppressedEmails] },
  }).lean();

  if (contacts.length === 0) return 0;

  const memberships = await ListMembership.find({
    contactId: { $in: contacts.map((contact) => contact._id) },
  }).lean();
  const listMap = new Map<string, string[]>();
  for (const membership of memberships) {
    const key = membership.contactId.toString();
    listMap.set(key, [
      ...(listMap.get(key) ?? []),
      membership.listId.toString(),
    ]);
  }

  return contacts.filter((contact) =>
    evaluateSegment(root, flattenContact(contact), {
      listIds: listMap.get(contact._id.toString()) ?? [],
    }),
  ).length;
}

export function flattenContact(contact: {
  email: string;
  firstName?: string;
  lastName?: string;
  status: string;
  tags: string[];
  customFields?: Record<string, unknown>;
  createdAt: Date;
}): ContactRecord {
  const customFields = contact.customFields ?? {};
  return {
    email: contact.email,
    first_name: contact.firstName ?? "",
    last_name: contact.lastName ?? "",
    status: contact.status,
    tags: contact.tags,
    company: customFields.company,
    organization: customFields.organization,
    created_at: contact.createdAt,
    custom_fields: customFields,
  };
}
