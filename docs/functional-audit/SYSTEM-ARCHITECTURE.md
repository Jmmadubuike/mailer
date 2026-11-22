# System Architecture

## Stack

- Next.js 16 (App Router) + React 19 + Turbopack; TypeScript (strict)
- Tailwind CSS 4; MongoDB via Mongoose 9
- Resend SDK (management + per-domain sending); TipTap rich-text editor;
  Recharts; PapaParse + ExcelJS; zod; jose (JWT sessions); scrypt password
  hashing; sanitize-html

## Runtime topology

- Web: `src/app/**` page and route handlers.
- Services: `src/modules/**` (server-only business logic).
- Models: `src/models/**` (13 Mongoose models).
- Delivery: `src/modules/delivery/dispatch.ts` (audience snapshot + job
  creation) and `queue.ts` (claim, lease, send, retry, finalize).
- External: Resend API for domain management, sending, and webhooks.
- Background: `/api/internal/scheduler/run` (dispatch due campaigns, process a
  queue batch, finalize stalled campaigns) and `/api/internal/worker/run`
  (process a queue batch). Both are cron-invoked and require `CRON_SECRET`.

## Data flow (campaign send)

1. User creates a campaign (`POST /api/campaigns`) bound to one
   `SendingDomain`; `assertSendableDomain` validates the domain and sender.
2. Dispatch (`prepareCampaignDelivery`) re-validates the domain, resolves the
   audience (`resolveAudience`), snapshots eligible recipients into
   `CampaignRecipient`, and creates one `DeliveryJob` per recipient with a
   unique `idempotencyKey`.
3. Worker (`processQueue`) claims jobs with an atomic status transition and a
   5-minute lease, re-validates domain + platform sending settings, renders the
   template with personalization + a signed unsubscribe token, and calls the
   domain-scoped Resend client.
4. On success the recipient stores the provider message id and status moves to
   `sent`; the campaign moves `queued -> sending`.
5. `finalizeCampaign` marks the campaign `sent` or `partially_failed` when no
   pending/processing/retry jobs remain.
6. Resend webhooks are signature-verified, deduplicated by `svix-id`, persisted,
   and applied to the matching `CampaignRecipient` by provider message id;
   bounce/complaint create global suppressions.

## Cross-cutting concerns

- Auth: JWT in an httpOnly, SameSite=lax cookie (12h); per-route `authorizeApi`
  and per-page `requireRole`.
- Secrets: `RESEND_API_KEY` (account management) and per-domain sending keys are
  AES-256-GCM encrypted with `CREDENTIALS_ENCRYPTION_KEY`; only masked hints are
  exposed.
- Audit: `logAudit` records admin actions (best-effort, non-blocking).
- Settings: global kill switch, test mode, and daily send limit enforced in the
  worker immediately before send.
