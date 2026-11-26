import "server-only";
import { Contact } from "@/models/Contact";
import { ListMembership } from "@/models/ListMembership";
import { MailingList } from "@/models/MailingList";
import { AppError } from "@/lib/errors";
import { logAudit } from "@/lib/audit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROWS = 100000;
const REPORT_LIMIT = 1000;

export interface ImportMapping {
  email: string;
  firstName?: string;
  lastName?: string;
  tags?: string;
  customFields?: Record<string, string>;
}

export interface RunImportInput {
  rows: Array<Record<string, string>>;
  mapping: ImportMapping;
  duplicateMode: "skip" | "update" | "new_only";
  confirmConsent: boolean;
  listId?: string;
}

export interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  duplicates: number;
  invalid: number;
  report: Array<{ email: string; status: string; reason: string }>;
}

interface ParsedRecord {
  email: string;
  firstName?: string;
  lastName?: string;
  tags: string[];
  customFields: Record<string, string>;
}

export async function runImport(
  input: RunImportInput,
  actor: { id: string; email: string },
): Promise<ImportResult> {
  if (!input.confirmConsent) {
    throw new AppError(
      "You must confirm the lawful basis before importing contacts",
      400,
    );
  }
  if (!input.mapping.email) {
    throw new AppError("You must map a column to the email field", 400);
  }
  if (input.rows.length > MAX_ROWS) {
    throw new AppError(`Import is limited to ${MAX_ROWS} rows`, 400);
  }

  if (input.listId) {
    const list = await MailingList.findById(input.listId);
    if (!list) throw new AppError("Target mailing list not found", 404);
  }

  const report: ImportResult["report"] = [];
  const pushReport = (entry: ImportResult["report"][number]) => {
    if (report.length < REPORT_LIMIT) report.push(entry);
  };

  const seen = new Set<string>();
  const records: ParsedRecord[] = [];
  let invalid = 0;
  let duplicates = 0;

  for (const row of input.rows) {
    const rawEmail = row[input.mapping.email]?.trim().toLowerCase() ?? "";
    if (!EMAIL_PATTERN.test(rawEmail)) {
      invalid += 1;
      pushReport({
        email: rawEmail || "(empty)",
        status: "invalid",
        reason: "Invalid email address",
      });
      continue;
    }
    if (seen.has(rawEmail)) {
      duplicates += 1;
      pushReport({
        email: rawEmail,
        status: "duplicate",
        reason: "Duplicate in file",
      });
      continue;
    }
    seen.add(rawEmail);
    records.push({
      email: rawEmail,
      firstName: pick(row, input.mapping.firstName),
      lastName: pick(row, input.mapping.lastName),
      tags: parseTags(pick(row, input.mapping.tags)),
      customFields: mapCustomFields(row, input.mapping.customFields),
    });
  }

  const emails = records.map((record) => record.email);
  const existingDocs =
    emails.length > 0
      ? await Contact.find({ email: { $in: emails } })
          .select(
            input.duplicateMode === "update"
              ? "email firstName lastName tags customFields"
              : "email",
          )
          .lean()
      : [];
  const existing = new Map(existingDocs.map((contact) => [contact.email, contact]));
  const newRecords = records.filter((record) => !existing.has(record.email));

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  if (records.length > 0) {
    if (input.duplicateMode === "update") {
      await Contact.bulkWrite(
        records.map((record) => {
          const current = existing.get(record.email);
          return {
            updateOne: {
              filter: { email: record.email },
              update: {
                $set: buildContactFields(record, current),
                $setOnInsert: { email: record.email, status: "subscribed" },
              },
              upsert: true,
            },
          };
        }),
        { ordered: false },
      );
      imported = newRecords.length;
      updated = records.length - newRecords.length;
    } else if (newRecords.length > 0) {
      await Contact.insertMany(
        newRecords.map((record) => ({
          email: record.email,
          status: "subscribed",
          ...buildContactFields(record),
        })),
        { ordered: false },
      );
      imported = newRecords.length;
      skipped = records.length - newRecords.length;
    }
  }

  if (input.listId && newRecords.length > 0) {
    const newEmails = newRecords.map((record) => record.email);
    const created = await Contact.find({ email: { $in: newEmails } })
      .select("_id email")
      .lean();
    if (created.length > 0) {
      await ListMembership.bulkWrite(
        created.map((contact) => ({
          updateOne: {
            filter: { contactId: contact._id, listId: input.listId },
            update: {
              $setOnInsert: { contactId: contact._id, listId: input.listId },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
    }
  }

  for (const record of records) {
    if (report.length >= REPORT_LIMIT) break;
    if (existing.has(record.email)) {
      if (input.duplicateMode === "update") {
        pushReport({
          email: record.email,
          status: "updated",
          reason: "Updated existing contact",
        });
      } else {
        pushReport({
          email: record.email,
          status: "skipped",
          reason:
            input.duplicateMode === "skip"
              ? "Already exists"
              : "Existing contact (new-only mode)",
        });
      }
    } else {
      pushReport({
        email: record.email,
        status: "imported",
        reason: "New contact",
      });
    }
  }

  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "contacts.imported",
    targetType: "Contact",
    meta: { imported, updated, skipped, duplicates, invalid },
  });

  return { imported, updated, skipped, duplicates, invalid, report };
}

function buildContactFields(
  record: ParsedRecord,
  current?: {
    firstName?: string;
    lastName?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
  },
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    tags: record.tags.length > 0 ? record.tags : (current?.tags ?? []),
    customFields: {
      ...(current?.customFields ?? {}),
      ...record.customFields,
    },
  };

  const firstName = record.firstName ?? current?.firstName;
  const lastName = record.lastName ?? current?.lastName;
  if (firstName) fields.firstName = firstName;
  if (lastName) fields.lastName = lastName;

  return fields;
}

function pick(row: Record<string, string>, column?: string): string | undefined {
  if (!column) return undefined;
  const value = row[column]?.trim();
  return value ? value : undefined;
}

function parseTags(value?: string): string[] {
  if (!value) return [];
  return [
    ...new Set(
      value
        .split(/[,;]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

function mapCustomFields(
  row: Record<string, string>,
  customFields?: Record<string, string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, column] of Object.entries(customFields ?? {})) {
    const value = row[column]?.trim();
    if (key && value) result[key] = value;
  }
  return result;
}
