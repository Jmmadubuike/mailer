export function isStagingEnv(appEnv?: string): boolean {
  return appEnv === "staging";
}

export function parseAllowlist(raw?: string): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function recipientApproved(
  email: string,
  allowlist: Set<string>,
): boolean {
  return allowlist.has(email.trim().toLowerCase());
}
