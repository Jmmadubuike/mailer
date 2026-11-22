import "server-only";
import { getEnv } from "@/config/env";
import { AppError } from "@/lib/errors";
import {
  isStagingEnv,
  parseAllowlist,
  recipientApproved,
} from "@/lib/staging/allowlist";

export function isStaging(): boolean {
  return isStagingEnv(getEnv().APP_ENV);
}

export function assertStagingSendAllowed(to: string): void {
  if (!isStaging()) return;
  const allowlist = parseAllowlist(getEnv().STAGING_RECIPIENT_ALLOWLIST);
  if (allowlist.size === 0) {
    throw new AppError("Staging recipient allow-list is not configured", 500);
  }
  if (!recipientApproved(to, allowlist)) {
    throw new AppError("Recipient is not on the staging allow-list", 403);
  }
}
