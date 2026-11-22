# Production Deployment Report

## Deployment

- Target: Vercel Production environment, project `mailer`.
- Command: `vercel deploy --prod --yes` from the reviewed `staging` branch.
- Production deployment: `https://mailer-3d31mu64a-jmmadubuike.vercel.app`
  (aliased `https://mailer-chi-lilac.vercel.app`); custom domain
  `https://mailer.josephmmadubuike.com` serves production.

## Configuration (per operator instruction to reuse staging resources)

- Database: the staging MongoDB Atlas database (`mailer_staging`) is shared with
  production. NO dedicated production database was provisioned.
- Resend: the staging Resend account, sending domain
  `mail.josephmmadubuike.com`, and webhook secret are shared with production.
- `APP_ENV=production` (so the staging recipient allow-list does not apply).
- Sender identity: `Mailer <hello@mail.josephmmadubuike.com>`, Reply-To
  `jmmadubuike@gmail.com`.

## Verification

- Production `/login` returns 200.
- Production webhook endpoint rejects a bad signature with
  `{"error":"Invalid signature"}` (secret configured and verification active).
- Production smoke test: campaign `Production Smoke Test` dispatched and sent;
  recipient `jmmadubuike@gmail.com` recorded `delivered`, provider message id
  `01a20299-b3c0-70d5-928c-d7794f7c2b80`.
- Provider evidence via Resend `emails.get`: `from: Mailer
  <hello@mail.josephmmadubuike.com>`, `reply_to: [jmmadubuike@gmail.com]`,
  brand wordmark present, no placeholder brand, no raw template tokens.

## Important caveat

Production shares the staging database and staging Resend account. There is no
environment isolation: staging test records and production records live in the
same `mailer_staging` database, and the same Resend account/domain is used for
both. This was done at the operator's explicit direction ("use same staging
details for production"). A dedicated production database and Resend account
should be established before any real audience sends.

## Rollback

The previous Preview deployments are unaffected. To remove the production
deployment, run `vercel remove <production-deployment>` (requires explicit
approval). Production environment variables can be cleared with
`vercel env rm <NAME> production`.
