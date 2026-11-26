export type PersonalizationContext = Record<string, unknown>;

export const DEFAULT_PERSONALIZATION_FALLBACKS: Record<string, string> = {
  first_name: "there",
};

export interface RenderOptions {
  html?: boolean;
}

const VARIABLE_PATTERN =
  /\{\{\s*([a-zA-Z0-9_.]+)\s*(?:\|\s*default:\s*([^}]*?)\s*)?\}\}/g;

export function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeText(value: unknown): string {
  return String(value).replace(/[\r\n]+/g, " ");
}

export function renderTemplate(
  template: string,
  context: PersonalizationContext,
  fallbacks: Record<string, string> = {},
  options: RenderOptions = {},
): string {
  const escape = options.html === false ? escapeText : escapeHtml;

  return template.replace(
    VARIABLE_PATTERN,
    (match, rawKey: string, inlineDefault: string | undefined) => {
      const key = rawKey.trim();
      const value = resolveValue(key, context);
      const missing = value === undefined || value === null || value === "";
      const output = missing
        ? inlineDefault ?? fallbacks[key] ?? ""
        : String(value);
      return escape(output);
    },
  );
}

export function extractVariables(template: string): string[] {
  const variables = new Set<string>();
  for (const match of template.matchAll(VARIABLE_PATTERN)) {
    variables.add(match[1].trim());
  }
  return [...variables];
}

function resolveValue(
  key: string,
  context: PersonalizationContext,
): unknown {
  if (key === "current_year") {
    return String(new Date().getFullYear());
  }

  if (key.startsWith("custom_fields.")) {
    const field = key.slice("custom_fields.".length);
    const customFields = context.custom_fields;
    if (customFields && typeof customFields === "object") {
      return (customFields as Record<string, unknown>)[field];
    }
    return undefined;
  }

  return context[key];
}
