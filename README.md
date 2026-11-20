# Mailer

A single-organization email marketing platform built on Next.js 16 (App
Router), TypeScript, MongoDB/Mongoose, and Resend.

This project is a donation from Jmmadubuike to businesses that find it hard to
reach their email list with promotions and marketing. Use it, adapt it, and
share it freely under the MIT license.

## Current status

In place so far:

- Project scaffold, MongoDB connection, core models, secure session
  authentication with roles, audit logging, and encrypted credential storage.
- **Sending Domains** module: multiple verified Resend domains, each with its
  own API key and sender identity, plus per-domain and combined stats.
- **Campaign engine**: create/schedule/cancel campaigns, select a verified
  sending domain and sender identity, resolve audiences from mailing lists
  (with suppression filtering), and snapshot recipients.
- **Durable delivery queue**: MongoDB-backed jobs with atomic claims, leases,
  exponential backoff, retry classification, per-domain key resolution, and
  per-recipient provider message IDs. A domain never silently fails over to
  another.
- **Scheduling and webhooks**: a due-campaign dispatcher and worker exposed as
  cron endpoints, plus a signature-verified Resend webhook handler that updates
  recipient and domain statuses.
- **Personalization**: `{{first_name}}`, `{{last_name}}`,
  `{{custom_fields.x}}`, `{{unsubscribe_url}}`, `{{current_year}}`, with
  inline `| default:` fallbacks and HTML escaping.
- **Unsubscribe**: secure HMAC-signed tokens, a confirmation page, RFC 8058
  List-Unsubscribe headers, and automatic suppression/contact opt-out.
- **Contacts and suppressions**: central contact database with search,
  status, export, bulk delete, and a suppression management screen.
- **Analytics**: combined and per-domain delivery and engagement stats derived
  from recipient records and webhook events.
- **Segments**: dynamic AND/OR audience filters with live estimated counts.
- **Templates**: reusable HTML templates with a sandboxed preview and a
  seeded starter library.
- **Email editor**: a TipTap rich-text editor plus HTML source and sandboxed
  preview modes, shared by templates and campaigns.
- **Contact import**: a CSV/XLSX import wizard with column mapping, custom
  fields, duplicate handling, consent confirmation, and a final report.
- **Campaign reports**: per-campaign stats, recipient-level statuses, CSV
  export, test sends, rescheduling, and cancellation.
- **Team and settings**: role-based user management, password reset, the
  global kill switch, daily sending limit, test mode, and audit logs.
- **Safety**: HTML sanitization, encrypted credentials, webhook signature
  verification, and CSV formula-injection protection.

Still to build: list-level unsubscribe preferences and a re-consent flow,
dashboard date filters and engagement charts, and integration/end-to-end tests.
See
[docs/KNOWN_LIMITATIONS.md](docs/KNOWN_LIMITATIONS.md).

## Setup

1. Copy `.env.example` to `.env.local` and fill in every value:

   ```bash
   cp .env.example .env.local
   ```

   Generate the two secrets:

   ```bash
   openssl rand -base64 32   # AUTH_SECRET
   openssl rand -base64 32   # CREDENTIALS_ENCRYPTION_KEY
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Seed the first Owner account:

   ```bash
   node --env-file=.env.local scripts/seed-owner.mjs
   ```

   Set `SEED_EMAIL`, `SEED_PASSWORD`, `SEED_NAME`, and `SEED_ROLE` to override
   the defaults.

4. Run the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000), sign in, and open
**Administration → Sending Domains**.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Background processing on Vercel

Scheduled dispatch and delivery run through two cron endpoints (see
[docs/EMAIL_DELIVERY.md](docs/EMAIL_DELIVERY.md)). On Vercel, add two Cron jobs
both hitting `POST` with header `x-cron-secret: <CRON_SECRET>`:

- `https://<app>/api/internal/scheduler/run` — every minute.
- `https://<app>/api/internal/worker/run` — every minute.

Locally you can trigger either endpoint manually with `curl`.
