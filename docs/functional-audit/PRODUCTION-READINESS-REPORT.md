# Production Readiness Report

## Classifications

- Branding implementation: Partial — centralized system and branded workflows
  are done; logo, brand website, physical address, and legal details are missing
  and were not fabricated.
- Staging verification: Passed — delivery, webhooks, Reply-To, finite daily
  quota, and branded rendering all verified with provider evidence.
- Production environment: Ready (reusing the staging database and Resend
  account per operator instruction; see isolation caveat in
  PRODUCTION-DEPLOYMENT-REPORT.md).
- Production deployment: Completed.
- Production email delivery: Verified (one smoke email to a controlled address).

## What is required to proceed to production

1. Dedicated production MongoDB database (separate from `mailer_staging`).
2. Production Resend account with its own API key and a production webhook
   signing secret.
3. A production sending domain with SPF, DKIM, and DMARC configured and
   verified.
4. Production `DATABASE_URL`, `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`,
   `AUTH_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`, `CRON_SECRET`, `APP_URL`,
   `EMAIL_FROM_NAME`, `EMAIL_FROM_ADDRESS`, and `EMAIL_REPLY_TO`.
5. An authorized production smoke-test recipient (a single address controlled by
   the operator).
6. Final brand inputs: logo URL, brand website, and any required legal/address
   footer text.

## Staging evidence summary

- Delivery, multi-domain credential isolation, suppression, webhook
  verification/dedup, Reply-To, finite quota accounting, and branded rendering
  were validated in the isolated staging environment
  (`mailer.example.com`).
- Remaining unvalidated failure-mode tests: >100-recipient multi-batch, worker
  crash/lease recovery, provider-timeout idempotency, and concurrent quota —
  these require additional authorized recipients/infrastructure.

## Decision

Production has been deployed and one controlled smoke email verified. The
platform is live at `https://mailer.example.com` but currently shares
the staging database and Resend account; establish dedicated production
infrastructure before sending to real audiences.
