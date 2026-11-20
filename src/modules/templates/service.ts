import "server-only";
import { EmailTemplate, type IEmailTemplate } from "@/models/EmailTemplate";
import { sanitizeEmailHtml } from "@/lib/security/sanitize";
import { AppError } from "@/lib/errors";
import {
  DEFAULT_TEMPLATE_COLORS,
  type TemplateColors,
} from "@/lib/templates/colors";

export interface TemplateInput {
  name: string;
  description?: string;
  category?: string;
  subject: string;
  previewText?: string;
  htmlContent: string;
  textContent?: string;
  colors?: TemplateColors;
}

export async function listTemplates(): Promise<IEmailTemplate[]> {
  return EmailTemplate.find().sort({ name: 1 }).lean();
}

export async function getTemplate(id: string): Promise<IEmailTemplate> {
  const template = await EmailTemplate.findById(id).lean();
  if (!template) throw new AppError("Template not found", 404);
  return template;
}

export async function createTemplate(input: TemplateInput): Promise<IEmailTemplate> {
  return EmailTemplate.create({
    ...input,
    htmlContent: sanitizeEmailHtml(input.htmlContent),
    colors: input.colors ?? DEFAULT_TEMPLATE_COLORS,
  });
}

export async function updateTemplate(
  id: string,
  input: Partial<TemplateInput>,
): Promise<IEmailTemplate> {
  const update: Partial<TemplateInput> = { ...input };
  if (input.htmlContent !== undefined) {
    update.htmlContent = sanitizeEmailHtml(input.htmlContent);
  }
  const template = await EmailTemplate.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true },
  );
  if (!template) throw new AppError("Template not found", 404);
  return template;
}

export async function deleteTemplate(id: string): Promise<void> {
  const template = await EmailTemplate.findByIdAndDelete(id);
  if (!template) throw new AppError("Template not found", 404);
}

const STARTERS: Array<TemplateInput & { category: string }> = [
  {
    name: "Newsletter",
    category: "Newsletter",
    subject: "Your monthly update, {{first_name}}",
    previewText: "Fresh updates inside.",
    htmlContent: starterLayout({
      heading: "Your monthly update",
      body: "Hello {{first_name}}, here is your monthly update from {{organization | default: us}}.",
      cta: "Read the latest",
    }),
  },
  {
    name: "Business Announcement",
    category: "Announcement",
    subject: "An important announcement",
    htmlContent: starterLayout({
      heading: "We have news",
      body: "{{first_name}}, we wanted you to hear it first.",
      cta: "Learn more",
    }),
  },
  {
    name: "Product Promotion",
    category: "Promotion",
    subject: "A special offer for you",
    htmlContent: starterLayout({
      heading: "A special offer for you",
      body: "Hello {{first_name}}, take a look at this limited-time offer.",
      cta: "See the offer",
    }),
  },
  {
    name: "Event Invitation",
    category: "Events",
    subject: "You're invited",
    htmlContent: starterLayout({
      heading: "You're invited",
      body: "Hello {{first_name}}, we would love to see you there.",
      cta: "RSVP",
    }),
  },
  {
    name: "Welcome Email",
    category: "Onboarding",
    subject: "Welcome, {{first_name}}!",
    htmlContent: starterLayout({
      heading: "Welcome aboard",
      body: "Thanks for joining us, {{first_name}}.",
      cta: "Get started",
    }),
  },
  {
    name: "Partnership Outreach",
    category: "Partnership",
    subject: "Let's work together",
    htmlContent: starterLayout({
      heading: "Partnership opportunity",
      body: "Hello {{first_name}}, we would love to collaborate.",
      cta: "Start a conversation",
    }),
  },
  {
    name: "Follow-up Email",
    category: "Follow-up",
    subject: "Following up",
    htmlContent: starterLayout({
      heading: "Following up",
      body: "Hi {{first_name}}, just following up on our last conversation.",
      cta: "Reply",
    }),
  },
  {
    name: "Educational Announcement",
    category: "Education",
    subject: "New learning resources",
    htmlContent: starterLayout({
      heading: "Learn with us",
      body: "Hi {{first_name}}, explore our latest resources.",
      cta: "Browse resources",
    }),
  },
];

export async function seedStarterTemplates(): Promise<number> {
  let created = 0;
  for (const starter of STARTERS) {
    const existing = await EmailTemplate.findOne({ name: starter.name }).lean();
    if (existing) {
      await EmailTemplate.findByIdAndUpdate(existing._id, {
        $set: {
          ...starter,
          htmlContent: sanitizeEmailHtml(starter.htmlContent),
          colors: starter.colors ?? DEFAULT_TEMPLATE_COLORS,
        },
      });
      continue;
    }
    await createTemplate(starter);
    created += 1;
  }
  return created;
}

function starterLayout(opts: {
  heading: string;
  body: string;
  cta?: string;
}): string {
  const button = opts.cta
    ? `<p><a href="#" style="display:inline-block;background-color:{{color_primary}};color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:4px;font-size:14px">${opts.cta}</a></p>`
    : "";
  return (
    `<div style="background-color:{{color_background}};color:{{color_text}};font-family:Arial,Helvetica,sans-serif;padding:24px;line-height:1.5">` +
    `<h1 style="color:{{color_primary}};font-size:20px;margin:0 0 12px">${opts.heading}</h1>` +
    `<p style="margin:0 0 12px">${opts.body}</p>` +
    button +
    `<p style="margin-top:16px;font-size:12px;color:#6b7280"><a href="{{unsubscribe_url}}" style="color:#6b7280">Unsubscribe</a></p>` +
    `</div>`
  );
}
