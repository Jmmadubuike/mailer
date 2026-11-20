import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/client";
import { authorizeApi, isApiError } from "@/lib/auth/api";
import { readJson } from "@/lib/api";
import {
  deleteTemplate,
  getTemplate,
  updateTemplate,
} from "@/modules/templates/service";
import { AppError } from "@/lib/errors";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional(),
  category: z.string().trim().optional(),
  subject: z.string().trim().min(1).optional(),
  previewText: z.string().trim().optional(),
  htmlContent: z.string().min(1).optional(),
  textContent: z.string().optional(),
  colors: z
    .object({
      primary: z.string().min(1),
      background: z.string().min(1),
      text: z.string().min(1),
    })
    .optional(),
});

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  try {
    const template = await getTemplate(id);
    return NextResponse.json({
      template: {
        id: template._id.toString(),
        name: template.name,
        description: template.description ?? null,
        category: template.category ?? null,
        subject: template.subject,
        previewText: template.previewText ?? null,
        htmlContent: template.htmlContent,
        textContent: template.textContent ?? null,
        colors: template.colors ?? null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: Context) {
  const auth = await authorizeApi(
    "owner",
    "administrator",
    "campaign_manager",
  );
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const template = await updateTemplate(id, parsed.data);
  return NextResponse.json({
    template: {
      id: template._id.toString(),
      name: template.name,
      description: template.description ?? null,
      category: template.category ?? null,
      subject: template.subject,
      htmlContent: template.htmlContent,
      colors: template.colors ?? null,
    },
  });
}

export async function DELETE(_request: Request, context: Context) {
  const auth = await authorizeApi("owner", "administrator");
  if (isApiError(auth)) return auth.response;
  await connectDB();

  const { id } = await context.params;
  await deleteTemplate(id);
  return NextResponse.json({ ok: true });
}
