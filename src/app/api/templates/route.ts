import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import { createTemplate, listTemplates } from "@/modules/templates/service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const templateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  subject: z.string().trim().min(1, "Subject is required"),
  previewText: z.string().trim().optional(),
  htmlContent: z.string().min(1, "HTML content is required"),
  textContent: z.string().optional(),
  colors: z
    .object({
      primary: z.string().min(1),
      background: z.string().min(1),
      text: z.string().min(1),
    })
    .optional(),
});

export async function GET() {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const templates = await listTemplates();
  return NextResponse.json({
    templates: templates.map(serializeTemplate),
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

  const parsed = templateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const template = await createTemplate(parsed.data);
  return NextResponse.json(
    { template: serializeTemplate(template) },
    { status: 201 },
  );
}

function serializeTemplate(template: {
  _id: { toString(): string };
  name: string;
  description?: string;
  category?: string;
  subject: string;
  previewText?: string;
  htmlContent: string;
  textContent?: string;
  colors?: { primary: string; background: string; text: string } | null;
}) {
  return {
    id: template._id.toString(),
    name: template.name,
    description: template.description ?? null,
    category: template.category ?? null,
    subject: template.subject,
    previewText: template.previewText ?? null,
    htmlContent: template.htmlContent,
    textContent: template.textContent ?? null,
    colors: template.colors ?? null,
  };
}
