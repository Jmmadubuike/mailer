import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  CREDENTIALS_ENCRYPTION_KEY: z
    .string()
    .min(1, "CREDENTIALS_ENCRYPTION_KEY is required")
    .refine((value) => {
      try {
        return Buffer.from(value, "base64").length === 32;
      } catch {
        return false;
      }
    }, "CREDENTIALS_ENCRYPTION_KEY must be a base64-encoded 32-byte key"),
  RESEND_API_KEY: z.string().optional(),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  WORKER_BATCH_SIZE: z.coerce.number().int().positive().default(100),
  APP_URL: z.string().url().default("http://localhost:3000"),
  EMAIL_FROM_NAME: z.string().default("Mailer"),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  EMAIL_REPLY_TO: z.string().email().optional(),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => issue.message)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${missing}`);
  }

  cached = parsed.data;
  return cached;
}
