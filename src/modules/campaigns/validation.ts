import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Must be a valid email");

export const createCampaignSchema = z.object({
  name: z.string().trim().min(1, "Campaign name is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  fromName: z.string().trim().min(1, "Sender name is required"),
  fromEmail: email,
  replyTo: email.optional(),
  previewText: z.string().trim().optional(),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  sendingDomainId: z.string().min(1, "Sending domain is required"),
  selectedLists: z.array(z.string()).default([]),
  selectedSegments: z.array(z.string()).default([]),
  sendMode: z.enum(["draft", "now", "scheduled"]).default("draft"),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
});
