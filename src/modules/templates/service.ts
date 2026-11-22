import "server-only";
import { AppError } from "@/lib/errors";
import { TEMPLATES, type EmailTemplate } from "@/modules/templates/catalog";

export type { EmailTemplate } from "@/modules/templates/catalog";

export async function listTemplates(): Promise<EmailTemplate[]> {
  return [...TEMPLATES].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTemplate(id: string): Promise<EmailTemplate> {
  const template = TEMPLATES.find((entry) => entry.id === id);
  if (!template) throw new AppError("Template not found", 404);
  return template;
}
