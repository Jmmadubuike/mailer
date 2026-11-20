import "server-only";
import { Contact } from "@/models/Contact";
import { ListMembership } from "@/models/ListMembership";
import { MailingList } from "@/models/MailingList";
import { AppError } from "@/lib/errors";
import { logAudit } from "@/lib/audit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ROWS = 10000;

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

  const result: ImportResult = {
    imported: 0,
    updated: 0,
    skipped: 0,
    duplicates: 0,
    invalid: 0,
    report: [],
  };
  const seen = new Set<string>();

  for (const row of input.rows) {
    const rawEmail = row[input.mapping.email]?.trim().toLowerCase() ?? "";
    if (!EMAIL_PATTERN.test(rawEmail)) {
      result.invalid += 1;
      result.report.push({ email: rawEmail || "(empty)", status: "invalid", reason: "Invalid email address" });
      continue;
    }
    if (seen.has(rawEmail)) {
      result.duplicates += 1;
      result.report.push({ email: rawEmail, status: "duplicate", reason: "Duplicate in file" });
      continue;
    }
    seen.add(rawEmail);

    const fields = {
      firstName: pick(row, input.mapping.firstName),
      lastName: pick(row, input.mapping.lastName),
      tags: parseTags(pick(row, input.mapping.tags)),
      customFields: mapCustomFields(row, input.mapping.customFields),
    };

    const existing = await Contact.findOne({ email: rawEmail });
    if (existing) {
      if (input.duplicateMode === "skip") {
        result.skipped += 1;
        result.report.push({ email: rawEmail, status: "skipped", reason: "Already exists" });
        continue;
      }
      if (input.duplicateMode === "new_only") {
        result.skipped += 1;
        result.report.push({ email: rawEmail, status: "skipped", reason: "Existing contact (new-only mode)" });
        continue;
      }

      // Update without ever overriding an opt-out/suppression status.
      existing.firstName = fields.firstName ?? existing.firstName;
      existing.lastName = fields.lastName ?? existing.lastName;
      existing.tags = fields.tags.length > 0 ? fields.tags : existing.tags;
      existing.customFields = {
        ...(existing.customFields ?? {}),
        ...fields.customFields,
      };
      await existing.save();
      result.updated += 1;
      result.report.push({ email: rawEmail, status: "updated", reason: "Updated existing contact" });
    } else {
      const contact = await Contact.create({
        email: rawEmail,
        firstName: fields.firstName,
        lastName: fields.lastName,
        tags: fields.tags,
        customFields: fields.customFields,
        status: "subscribed",
      });
      result.imported += 1;
      result.report.push({ email: rawEmail, status: "imported", reason: "New contact" });

      if (input.listId) {
        await ListMembership.findOneAndUpdate(
          { contactId: contact._id, listId: input.listId },
          { $setOnInsert: { contactId: contact._id, listId: input.listId } },
          { upsert: true },
        );
      }
    }
  }

  await logAudit({
    actorEmail: actor.email,
    actorId: actor.id,
    action: "contacts.imported",
    targetType: "Contact",
    meta: {
      imported: result.imported,
      updated: result.updated,
      skipped: result.skipped,
      duplicates: result.duplicates,
      invalid: result.invalid,
    },
  });

  return result;
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
