# Security & Reliability Audit
## Authentication & authorization
- JWT session in httpOnly, SameSite=lax cookie (secure in production), 12-hour
  expiry; scrypt password hashing with per-user salt and timing-safe compare.
- Every API route calls `authorizeApi` with an explicit role allowlist before
  touching data; pages use `requireRole`. Frontend role gating is backed by
  backend enforcement.
- Password reset uses a hashed token (sha256) with 1-hour expiry and
  anti-enumeration responses.
- Login rate limit is in-memory (F-07).
## Secrets & data exposure
- Resend per-domain keys are AES-256-GCM encrypted with an external 32-byte key;
  only masked hints are returned.
- `SendingDomain` credential fields are `select:false`.
- No API returns password hashes or full API keys.
## Input validation & injection
- zod schemas on every mutating route; emails normalized/lowercased.
- Email HTML sanitized with `sanitize-html` allowlist (no script/iframe/event
  handlers); link schemes restricted to http/https/mailto (images + cid).
- Sender email must belong to the selected domain, preventing header spoofing.
- CSV import is re-validated server-side (row cap, email format, consent).
## Webhook security
- Resend webhook signature verified with `RESEND_WEBHOOK_SECRET`; malformed or
  missing secret rejected.
- Deduplicated by svix-id; events persisted before processing.
## Background endpoints
- Scheduler and worker endpoints require `x-cron-secret` / Bearer matching
  `CRON_SECRET`; otherwise 401.
## Findings
- F-06 · P2 · Error-handling inconsistency: several routes throw `AppError`
  without a catch and therefore return 500 instead of the intended status —
  `POST /api/contacts` duplicate (should be 409), `PATCH/DELETE
  /api/contacts/:id` not found (404), `DELETE /api/suppressions/:id` not found
  (404), `PATCH /api/users/:id` not found (404), and any invalid ObjectId path
  (e.g., campaign detail) which raises an unhandled CastError. `POST /api/users`
  also misclassifies all failures as 409.
- F-07 · P2 · Login rate limiting lives in an in-memory `Map`; it does not
  persist or span instances, so it is ineffective on multi-instance serverless
  deployments.
- F-12 · P3 · No last-owner guard; an owner can demote themselves or the last
  owner out of the owner role.
- F-13 · P3 · RESOLVED (verified) — `csvEscape` neutralizes formula injection;
  existing tests cover it.
## Positive
- Audit logging is present for admin mutations, login, dispatch, and unsubscribe
  (best-effort, non-blocking).
- No sensitive values are logged; the only fallback log is the password-reset
  URL when no sending domain is configured (development fallback, SEC-02 in the
  UI audit).
- Multi-domain credential isolation is genuinely enforced.
## Reliability risks summary
Accidental bulk emailing and data loss are well-mitigated (confirmation dialogs,
kill switch, test mode, daily limit, domain sendability gates). The most
material remaining risks are the suppression/send race (F-01), stale delivery
leases (F-04), and the 500-vs-4xx error paths (F-06).
