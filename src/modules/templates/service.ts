import "server-only";
import { EmailTemplate, type IEmailTemplate } from "@/models/EmailTemplate";
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
    colors: input.colors ?? DEFAULT_TEMPLATE_COLORS,
  });
}

export async function updateTemplate(
  id: string,
  input: Partial<TemplateInput>,
): Promise<IEmailTemplate> {
  const template = await EmailTemplate.findByIdAndUpdate(
    id,
    { $set: input },
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
    ? `<p style="margin:24px 0 0"><a href="#" style="display:inline-block;background-color:{{color_primary}};color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:6px;font-size:14px;font-weight:600">${opts.cta}</a></p>`
    : "";
  return (
    `<div style="background-color:{{color_background}};font-family:Arial,Helvetica,sans-serif;padding:32px 0">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{{color_background}}"><tr><td align="center">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%"><tr><td style="background-color:#ffffff;border-radius:10px;overflow:hidden">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">` +
    `<tr><td style="padding:22px 32px;border-bottom:4px solid {{color_primary}}"><span style="color:{{color_primary}};font-size:20px;font-weight:700;letter-spacing:0.5px">SPRAY N SNIFF</span></td></tr>` +
    `<tr><td style="padding:36px 32px 28px">` +
    `<h1 style="color:{{color_text}};font-size:22px;margin:0 0 16px;font-weight:700">${opts.heading}</h1>` +
    `<p style="color:{{color_text}};font-size:15px;line-height:1.65;margin:0">${opts.body}</p>` +
    button +
    `<p style="margin:28px 0 0;font-size:13px;color:#64748b">Have a question? Just reply to this email and we&rsquo;ll get back to you.</p>` +
    `</td></tr>` +
    `<tr><td style="padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;line-height:1.7">` +
    `<p style="margin:0">Spraynsniff &middot; 1 Example Street, Lagos, Nigeria</p>` +
    `<p style="margin:8px 0 0">You&rsquo;re receiving this because you subscribed. <a href="{{unsubscribe_url}}" style="color:#64748b">Unsubscribe</a></p>` +
    `</td></tr>` +
    `</table>` +
    `</td></tr></table>` +
    `</td></tr></table>` +
    `</div>`
  );
}
