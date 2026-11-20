import "server-only";
import mongoose from "mongoose";
import { ListMembership } from "@/models/ListMembership";
import { Contact } from "@/models/Contact";
import { Suppression } from "@/models/Suppression";
import { Segment } from "@/models/Segment";
import { evaluateSegment } from "@/modules/segments/evaluate";
import { flattenContact } from "@/modules/segments/service";

export interface ResolvedAudience {
  emails: string[];
  contacts: Record<
    string,
    {
      first_name?: string;
      last_name?: string;
      custom_fields?: Record<string, unknown>;
    }
  >;
  memberCount: number;
  eligibleCount: number;
  excludedCount: number;
}

export async function resolveAudience(
  listIds: string[],
  segmentIds: string[] = [],
): Promise<ResolvedAudience> {
  if (listIds.length === 0 && segmentIds.length === 0) {
    return {
      emails: [],
      contacts: {},
      memberCount: 0,
      eligibleCount: 0,
      excludedCount: 0,
    };
  }

  const objectIds = listIds.map((id) => new mongoose.Types.ObjectId(id));
  const orFilters: Array<
    | { scope: "all" }
    | { scope: "list"; listId: { $in: mongoose.Types.ObjectId[] } }
  > = [{ scope: "all" }];
  if (listIds.length > 0) {
    orFilters.push({ scope: "list", listId: { $in: objectIds } });
  }
  const suppressions = await Suppression.find({ $or: orFilters }).lean();
  const suppressedEmails = [...new Set(suppressions.map((s) => s.email))];

  const candidateIds = new Set<string>();

  if (listIds.length > 0) {
    const contactIds = await ListMembership.distinct("contactId", {
      listId: { $in: objectIds },
    });
    for (const id of contactIds) candidateIds.add(id.toString());
  }

  if (segmentIds.length > 0) {
    const segments = await Segment.find({
      _id: {
        $in: segmentIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    }).lean();

    if (segments.length > 0) {
      const allContacts = await Contact.find({
        status: "subscribed",
        email: { $nin: suppressedEmails },
      }).lean();

      const memberships = await ListMembership.find({
        contactId: { $in: allContacts.map((contact) => contact._id) },
      }).lean();
      const listMap = new Map<string, string[]>();
      for (const membership of memberships) {
        const key = membership.contactId.toString();
        listMap.set(key, [
          ...(listMap.get(key) ?? []),
          membership.listId.toString(),
        ]);
      }

      for (const contact of allContacts) {
        const matches = segments.some((segment) =>
          evaluateSegment(segment.root, flattenContact(contact), {
            listIds: listMap.get(contact._id.toString()) ?? [],
          }),
        );
        if (matches) candidateIds.add(contact._id.toString());
      }
    }
  }

  const memberCount = candidateIds.size;
  const contacts = await Contact.find({
    _id: {
      $in: [...candidateIds].map((id) => new mongoose.Types.ObjectId(id)),
    },
    status: "subscribed",
    email: { $nin: suppressedEmails },
  })
    .select("email firstName lastName customFields")
    .lean();

  const emails = [...new Set(contacts.map((contact) => contact.email))];
  const contactMap = Object.fromEntries(
    contacts.map((contact) => [
      contact.email,
      {
        first_name: contact.firstName,
        last_name: contact.lastName,
        custom_fields: contact.customFields,
      },
    ]),
  );

  return {
    emails,
    contacts: contactMap,
    memberCount,
    eligibleCount: contacts.length,
    excludedCount: memberCount - contacts.length,
  };
}
