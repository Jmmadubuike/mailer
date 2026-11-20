import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Must be a valid email");

export const createSendingDomainSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/,
      "Enter a valid domain name (for example, mail.example.com)",
    ),
  apiKey: z.string().trim().min(1).optional(),
  defaultSenderName: z.string().trim().optional(),
  defaultSenderAddress: email.optional().or(z.literal("")),
  defaultReplyTo: email.optional().or(z.literal("")),
});

export const updateSendingDomainSchema = z.object({
  name: z.string().trim().min(1).optional(),
  apiKey: z.string().trim().min(1).optional(),
  defaultSenderName: z.string().trim().optional(),
  defaultSenderAddress: email.optional().or(z.literal("")),
  defaultReplyTo: email.optional().or(z.literal("")),
});

export const testDomainSchema = z.object({
  to: email,
});
