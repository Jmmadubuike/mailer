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

## Issues found during the run

None new. The local automated regression passed. The idempotency-key and atomic
webhook refinements made during the pre-staging review compile cleanly and are
covered by the unit tests above; their live-provider behaviour remains
unverified (BLOCKED, not failed).

## Corrections implemented during this run

Implemented the staging safety guard: `APP_ENV`/`STAGING_RECIPIENT_ALLOWLIST`
configuration, server-side recipient allow-list enforcement at the provider
submission choke point, and a staging badge. Local checks re-run and pass.
