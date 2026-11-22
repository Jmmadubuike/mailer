# Staging Provisioning Report

## Infrastructure inventory (Phase 1)

- Production branch: `main`; remote `origin` = `https://github.com/Jmmadubuike/mailer.git`.
- Reviewed base commit: `d08f7a3` ("Add donation note to README").
- Routes: App Router pages under `src/app`; API handlers under `src/app/api`.
- Database: single `DATABASE_URL` Mongoose connection (`src/lib/db/client.ts`);
  no per-environment database selection exists beyond the variable itself.
- Environment variables: `DATABASE_URL`, `AUTH_SECRET`,
  `CREDENTIALS_ENCRYPTION_KEY`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`,
  `CRON_SECRET`, `WORKER_BATCH_SIZE`, `APP_URL`, `EMAIL_FROM_NAME`,
  `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO`, plus new `APP_ENV` and
  `STAGING_RECIPIENT_ALLOWLIST`.
- Resend: account key for management; per-domain encrypted keys for sending.
- Webhook: `POST /api/webhooks/resend`, raw-body signature verification with
  `RESEND_WEBHOOK_SECRET`, deduplicated by svix-id.
- Background processes: Vercel Cron invokes
  `/api/internal/scheduler/run` (dispatch due + process a batch + finalize
  stalled) and `/api/internal/worker/run` (process a batch) every minute,
  gated by `CRON_SECRET`. There are no always-on worker processes; Vercel Cron
  is the execution model.
- Auth/session: JWT in `mailer_session` httpOnly cookie; `secure` only in
  `NODE_ENV === "production"`.
- File/image storage: none found.

## Phase 2 — Staging branch

DONE (local). Created permanent local branch `staging` from `d08f7a3` with the
working tree preserved. NOT pushed — pushing requires confirming the GitHub→Vercel
link and that only Preview (not Production) is targeted for the `staging` branch.

## Phases 3–5 — Vercel / Atlas / Resend provisioning

BLOCKED (external). No Vercel CLI/token or linked-project access, no Atlas
connection string or staging database user, no separate staging Resend account
or staging sending domain/DNS access, and no user-provided staging hostname were
available. The exact remaining actions and prerequisites are listed in
STAGING-ENVIRONMENT-AND-ROLLBACK.md.

## Phase 6 — Staging safety guards

DONE (code). Added `APP_ENV` and `STAGING_RECIPIENT_ALLOWLIST` configuration, a
server-side guard (`src/lib/staging/guard.ts`) with pure helpers
(`src/lib/staging/allowlist.ts`), enforcement at the single provider-submission
choke point in `src/lib/resend/send.ts` (covers direct, campaign, retry,
scheduled, batch, and recovery sends), and a "STAGING" badge in the dashboard
shell. The guard is active only when `APP_ENV=staging`; in staging it fails
closed (500) if the allow-list is missing and rejects (403) any recipient not on
the normalized allow-list. Production/development are unaffected.

## Phases 7–8 — Environment variables and deployment

BLOCKED (external). New variables `APP_ENV` and `STAGING_RECIPIENT_ALLOWLIST`
are implemented in the codebase and must be set only on the staging
branch/environment. Deployment to Vercel Preview was not performed (no Vercel
access).

## Phase 9–10 — Functional validation and regression

NOT EXECUTED (external). Local regression passed: typecheck, ESLint, Vitest
9 files / 39 tests. Live validation is blocked pending the staging environment.

## Final classification

D — STAGING PROVISIONING BLOCKED (external prerequisites unavailable).
