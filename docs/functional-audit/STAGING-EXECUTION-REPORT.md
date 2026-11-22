# Staging Execution Report

## Provisioning update (latest directive)

- Local `staging` branch created from reviewed commit `d08f7a3`; `main` and the
  working tree are preserved. Not pushed (Vercel link/push not yet confirmed).
- Server-side staging guard implemented: `APP_ENV` +
  `STAGING_RECIPIENT_ALLOWLIST`, recipient allow-list enforcement at the
  provider-submission choke point, and a STAGING badge. Unit-tested
  (`src/lib/staging/guard.test.ts`).
- Local regression: typecheck 0, lint 0, Vitest 9 files / 39 tests.
- External provisioning (Vercel Preview env vars, Atlas staging database,
  staging Resend account/domain/DNS/webhook secret) remains BLOCKED.

## Execution metadata

- Date/time: 2026-11-22 08:23 +01:00 (Africa/Lagos)
- Branch: `main`
- Commit: `d08f7a3e178c922c0aadcdc1279de599921ad837`
- Working tree: dirty (remediation changes uncommitted)

## Environment identity

Local development machine. `DATABASE_URL` is a local MongoDB
(`127.0.0.1:27017/mailer`). The configured Resend account key belongs to the
operator's real account (contains verified real domains). `RESEND_WEBHOOK_SECRET`
is missing. No `.env.staging`/`.env.production` file exists. Staging isolation
could not be established, so external actions were not executed.

## Test results

| # | Test | Status | Notes |
| --- | --- | --- | --- |
| 1 | Automated regression | PASS | typecheck 0, lint 0, Vitest 8/34 pass |
| 2 | Sending-domain registration/verification | BLOCKED | no staging domain/DNS access |
| 3 | Small real staging send | BLOCKED | no verified staging domain or controlled recipients |
| 4 | Real webhook ingestion | BLOCKED | `RESEND_WEBHOOK_SECRET` missing |
| 5 | Queue >100 recipients | BLOCKED | no staging database/recipients |
| 6 | Worker crash & recovery | BLOCKED | no staging worker environment |
| 7 | Suppression enforcement & race | BLOCKED (unit PASS) | pure decision logic covered by `suppression.test.ts` |
| 8 | Concurrent daily quota | BLOCKED (unit PASS) | key/reservation logic covered by `limits.test.ts` |
| 9 | Forced timeout & idempotency | BLOCKED | requires controlled proxy against staging provider |
| 10 | Scheduled campaign recovery | BLOCKED | no staging database/cron |
| 11 | Multi-domain credential isolation | BLOCKED | needs two staging domains/creds |
| 12 | Campaign completion & accounting | BLOCKED | needs live sends |

Additional security checks (CSV injection, last-owner, monotonic webhook) are
covered at unit level and passed; live RBAC/API checks were NOT TESTED because
they require staging data or would mutate this non-staging database.

## Counts

- Real staging emails sent: 0
- Recipients processed: 0
- Webhook events received: 0
- Crash recovery proven: NO (BLOCKED)
- Idempotency proven against live provider: NO (BLOCKED; implemented in code)
- Suppression enforcement proven live: NO (BLOCKED; decision logic unit-tested)
- Concurrent quota proven live: NO (BLOCKED; reservation logic unit-tested)

## Defects discovered

None in the executed (local) tests.

## Corrections implemented

None required this run.

## Final staging decision

D — STAGING VALIDATION BLOCKED. A dedicated staging environment and staging
Resend account could not be established or distinguished from the operator's
real account. The platform is not ready for a production-readiness review until
the staging prerequisites are provisioned and the 12-test checklist is executed
against them.

## Live validation update (after provisioning)

- TEST 1 — Real Resend webhooks: PASS. Real `email.sent` and `email.delivered`
  events arrived, were signature-verified, deduplicated, and reconciled into
  recipient records (`status: delivered`, `events: [sent, delivered]`). Two
  defects were found and fixed (see STAGING-ISSUES-AND-RESOLUTIONS.md):
  Mongoose update pipeline option missing, and system-actor audit `actorId`
  casting.
- TEST 2 — Multi-recipient campaign: PASS (single batch). 3 controlled
  allow-listed recipients were eligible, queued, sent, and delivered; no
  duplicates, omissions, or failures; campaign status `sent`, recipientCount 3,
  3 unique provider message ids. Multi-batch (>1) was NOT TESTED because the
  operator overrode the recipient count to 3 (< WORKER_BATCH_SIZE).
- Quota reconciliation: NOT TESTED (daily limit is unset/0, so no reservation
  counter is exercised).
- Opened/clicked reconciliation: NOT TESTED (no opens/clicks occurred).

## Reply-To + quota validation update

- Reply-To: PASS. Precedence fixed and verified at the provider
  (`reply_to: [jmmadubuike@gmail.com]`, distinct from From).
- Finite daily quota: PASS. With `dailySendLimit=2`, a 3-recipient campaign sent
  2 and held 1 as a retryable pending job (reservation over-limit reverted);
  campaign was not marked sent while a recipient remained unprocessed. Limit was
  reset to 0 afterwards.
- Remaining: open/click reconciliation (needs recipient opens/clicks), true
  multi-batch >100 (needs >100 authorized recipients; allow-list currently has
  3), concurrent quota (parallel workers not exercised), crash/lease recovery,
  provider-timeout idempotency, and second-domain credential isolation.

## Remaining limitations

As documented in STAGING-ENVIRONMENT-AND-ROLLBACK.md and
STAGING-ISSUES-AND-RESOLUTIONS.md.
