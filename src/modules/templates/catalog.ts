import {
  DEFAULT_TEMPLATE_COLORS,
  type TemplateColors,
} from "@/lib/templates/colors";
import { brandedLayout } from "@/lib/email/brand";

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
  return brandedLayout({
    heading: opts.heading,
    body: opts.body,
    cta: opts.cta,
  });
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
