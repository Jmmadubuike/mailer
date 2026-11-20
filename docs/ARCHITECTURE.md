# Architecture

Mailer is a single-organization Next.js 16 App Router application. Server
Components render the dashboard; all sensitive work (authentication, delivery,
credentials) lives in server route handlers and modules under `src/modules`.

Logical modules:

- `auth` — password hashing (scrypt), signed HTTP-only session cookies, roles.
- `contacts`, `lists`, `segments`, `suppression` — audience data.
- `campaigns` — campaign lifecycle, audience resolution, reports.
- `delivery` — durable MongoDB-backed job queue and per-domain Resend routing.
- `sending-domains` — domain registry, encrypted API keys, stats, safety gates.
- `templates`, `personalization` — reusable emails and per-recipient rendering.
- `webhooks` — signature-verified Resend event ingestion.

Credentials are encrypted at rest with AES-256-GCM using an environment key and
are never returned to the browser.
