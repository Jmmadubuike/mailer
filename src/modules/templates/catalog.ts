import {
  DEFAULT_TEMPLATE_COLORS,
  type TemplateColors,
} from "@/lib/templates/colors";

export interface EmailTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  subject: string;
  previewText: string | null;
  htmlContent: string;
  textContent: string | null;
  colors: TemplateColors;
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

export const TEMPLATES: EmailTemplate[] = [
  {
    id: "newsletter",
    name: "Newsletter",
    description: "A recurring round-up with the latest updates.",
    category: "Newsletter",
    subject: "Your monthly update, {{first_name}}",
    previewText: "Fresh updates inside.",
    htmlContent: starterLayout({
      heading: "Your monthly update",
      body: "Hello {{first_name}}, here is your monthly update from {{organization | default: us}}.",
      cta: "Read the latest",
    }),
    textContent: null,
    colors: DEFAULT_TEMPLATE_COLORS,
  },
  {
    id: "business-announcement",
    name: "Business Announcement",
    description: "A formal update for your audience.",
    category: "Announcement",
    subject: "An important announcement",
    previewText: null,
    htmlContent: starterLayout({
      heading: "We have news",
      body: "{{first_name}}, we wanted you to hear it first.",
      cta: "Learn more",
    }),
    textContent: null,
    colors: DEFAULT_TEMPLATE_COLORS,
  },
  {
    id: "product-promotion",
    name: "Product Promotion",
    description: "Highlight a product or limited-time offer.",
    category: "Promotion",
    subject: "A special offer for you",
    previewText: null,
    htmlContent: starterLayout({
      heading: "A special offer for you",
      body: "Hello {{first_name}}, take a look at this limited-time offer.",
      cta: "See the offer",
    }),
    textContent: null,
    colors: DEFAULT_TEMPLATE_COLORS,
  },
  {
    id: "event-invitation",
    name: "Event Invitation",
    description: "Invite contacts to an upcoming event.",
    category: "Events",
    subject: "You're invited",
    previewText: null,
    htmlContent: starterLayout({
      heading: "You're invited",
      body: "Hello {{first_name}}, we would love to see you there.",
      cta: "RSVP",
    }),
    textContent: null,
    colors: DEFAULT_TEMPLATE_COLORS,
  },
  {
    id: "welcome-email",
    name: "Welcome Email",
    description: "Onboard new subscribers or customers.",
    category: "Onboarding",
    subject: "Welcome, {{first_name}}!",
    previewText: null,
    htmlContent: starterLayout({
      heading: "Welcome aboard",
      body: "Thanks for joining us, {{first_name}}.",
      cta: "Get started",
    }),
    textContent: null,
    colors: DEFAULT_TEMPLATE_COLORS,
  },
  {
    id: "partnership-outreach",
    name: "Partnership Outreach",
    description: "Start a collaboration conversation.",
    category: "Partnership",
    subject: "Let's work together",
    previewText: null,
    htmlContent: starterLayout({
      heading: "Partnership opportunity",
      body: "Hello {{first_name}}, we would love to collaborate.",
      cta: "Start a conversation",
    }),
    textContent: null,
    colors: DEFAULT_TEMPLATE_COLORS,
  },
  {
    id: "follow-up-email",
    name: "Follow-up Email",
    description: "Check back in after a previous conversation.",
    category: "Follow-up",
    subject: "Following up",
    previewText: null,
    htmlContent: starterLayout({
      heading: "Following up",
      body: "Hi {{first_name}}, just following up on our last conversation.",
      cta: "Reply",
    }),
    textContent: null,
    colors: DEFAULT_TEMPLATE_COLORS,
  },
  {
    id: "educational-announcement",
    name: "Educational Announcement",
    description: "Share new learning resources.",
    category: "Education",
    subject: "New learning resources",
    previewText: null,
    htmlContent: starterLayout({
      heading: "Learn with us",
      body: "Hi {{first_name}}, explore our latest resources.",
      cta: "Browse resources",
    }),
    textContent: null,
    colors: DEFAULT_TEMPLATE_COLORS,
  },
];
