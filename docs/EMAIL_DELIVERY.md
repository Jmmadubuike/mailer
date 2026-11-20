# Email delivery architecture

Delivery is durable and provider-agnostic at the routing layer, with Resend as
the only implemented provider.

## Flow

1. A campaign is created with a `sendingDomainId`, sender identity, and one or
   more mailing lists. It is saved as `draft`, `scheduled`, or queued
   immediately.
2. `prepareCampaignDelivery` re-validates the sending domain at dispatch time,
   resolves the audience (deduplicated contacts, excluding unsubscribed and
   suppressed addresses), and creates one `CampaignRecipient` per address plus
   one `DeliveryJob` per recipient.
3. A worker claims a bounded batch of jobs atomically using a run id and lease,
   resolves the domain's encrypted API key, and sends through a Resend client
   scoped to that domain.
4. On success the recipient records the provider message ID and `sent` status.
   On failure the job is retried with exponential backoff (up to a maximum) or
   marked permanently failed. There is no fallback to another domain.
5. Resend webhooks (signature-verified) update recipient events
   (`delivered`, `bounced`, `complained`, `opened`, `clicked`, `failed`) and
   sync domain verification status.

## Cron endpoints

- `POST /api/internal/scheduler/run` — dispatches due scheduled campaigns and
  then runs one worker batch.
- `POST /api/internal/worker/run` — runs one worker batch.

Both require the `x-cron-secret` header to match `CRON_SECRET`. On Vercel,
configure both as Cron jobs (every minute). No additional paid service is
required.

## Immediate sends

Creating a campaign in `now` mode dispatches recipients and processes one
batch inline (bounded by `WORKER_BATCH_SIZE`). Any remaining jobs are picked up
by the cron worker on subsequent runs.

## Idempotency and safety

- Each recipient has a unique `campaignId + email` constraint.
- Each delivery job has a unique idempotency key.
- A recipient that already has a `providerMessageId` is never sent twice.
- Sending is blocked unless the domain is verified, active, not
  emergency-stopped, has non-invalid credentials, and the sender email belongs
  to that domain.
