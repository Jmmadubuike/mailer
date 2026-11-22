# Staging Issues & Resolutions

## Blocking issues (no code correction needed; external prerequisites)

- STG-BLOCK-01: No dedicated staging environment exists. `.env.local` points to
  a local MongoDB and the operator's real Resend account; `RESEND_WEBHOOK_SECRET`
  is missing and there is no `.env.staging`. Resolution: provision a staging
  database + staging Resend account and set the variables listed in
  STAGING-ENVIRONMENT-AND-ROLLBACK.md.
- STG-BLOCK-02: No approved controlled staging recipients or staging-only
  sending domain were provided. Resolution: define the recipient allow-list and
  a staging domain with DNS control.

## Defects found and fixed during live validation

- STG-DEFECT-01: webhook recipient updates used a MongoDB aggregation pipeline
  array without Mongoose's `updatePipeline` option, causing
  `MongooseError: Cannot pass an array to query updates…` and silently failing
  reconciliation (the retry only marked the event processed). Fix: pass
  `{ updatePipeline: true }` in `applyEmailEvent` (`src/modules/webhooks/process.ts`).
- STG-DEFECT-02: system-actor audit entries passed `actorId: "system"` into an
  ObjectId field, so `AuditLog` writes failed validation silently. Fix: only set
  `actorId` when it is a valid ObjectId (`src/lib/audit.ts`).

Both fixes are committed on `staging` and deployed; regression suite passes
(typecheck, ESLint, Vitest 9 files / 39 tests).

## Reply-To defect

- Root cause: the global `EMAIL_REPLY_TO` environment variable was defined in
  `src/config/env.ts` but never read by the send path. Reply-To resolved only as
  `campaign.replyTo ?? domain.defaultReplyTo`, and the staging
  `mail.josephmmadubuike.com` domain's `defaultReplyTo` had been set equal to
  its From address, so the operator's intended distinct Reply-To never applied.
- Correction: added `resolveReplyTo()` precedence
  (message > domain default > global `EMAIL_REPLY_TO`) in
  `src/lib/resend/send.ts`; set the staging domain `defaultReplyTo` and Vercel
  `EMAIL_REPLY_TO` to `jmmadubuike@gmail.com`.
- Verification (provider): Resend `emails.get` for the test message returned
  `from: hello@mail.josephmmadubuike.com`, `reply_to: [jmmadubuike@gmail.com]`.
- Tests: `src/lib/resend/reply-to.test.ts` (precedence + missing fallback).

## Issues found during the run

None new. The local automated regression passed. The idempotency-key and atomic
webhook refinements made during the pre-staging review compile cleanly and are
covered by the unit tests above; their live-provider behaviour remains
unverified (BLOCKED, not failed).

## Corrections implemented during this run

Implemented the staging safety guard: `APP_ENV`/`STAGING_RECIPIENT_ALLOWLIST`
configuration, server-side recipient allow-list enforcement at the provider
submission choke point, and a staging badge. Local checks re-run and pass.
