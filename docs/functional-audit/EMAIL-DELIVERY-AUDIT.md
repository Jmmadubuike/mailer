# Email Delivery Engine Audit

## Flow

Dispatch (`prepareCampaignDelivery`) snapshots eligible recipients into
`CampaignRecipient` (unique `campaignId+email`) and creates one `DeliveryJob`
per recipient with `idempotencyKey = campaignId:recipientId`. The worker
(`processQueue`) claims jobs atomically with a 5-minute lease, re-validates the
domain and platform sending settings, renders content, and calls Resend through
the domain-scoped client.

## Reliability properties

- Duplicate-send prevention: WORKING at two levels — unique recipient snapshot
  (`$setOnInsert`), unique job `idempotencyKey`, and a runtime guard that skips
  any recipient that already has a provider message id.
- Batching: WORKING — jobs are claimed in bounded batches
  (`WORKER_BATCH_SIZE`, default 100).
- Retry: WORKING — transient errors (429/5xx/timeouts/network) move jobs to
  `retry_pending` with exponential backoff + jitter up to 5 minutes; max 5
  attempts.
- Permanent failure: WORKING — auth/verification/validation errors fail the job
  immediately and (for 401/403/forbidden) mark the domain credential invalid.
- Partial failure: WORKING — `finalizeCampaign` marks `partially_failed` when
  any job failed, `sent` when none failed, once no pending/processing/retry
  jobs remain.
- Stalled campaign finalization: PARTIAL — `finalizeStalledCampaigns` runs but
  only finalizes when the pending count is zero (F-04 below).

## Findings

- F-04 · P2 · Jobs left in `processing` past their lease (e.g., after a worker
  crash) are never reclaimed. `claimJobs` only selects `pending`/`retry_pending`
  and there is no lease-expiry reset, so a crashed worker can strand jobs and
  block campaign finalization indefinitely.
- F-08 · P2 · A dispatch failure after `scheduled -> queued` can strand a
  campaign in `queued` with no jobs; the stall finalizer can then mislabel it
  `sent` with zero recipients.
- F-15 · P2 · "Send now" does synchronous work inside the request and stops
  after one batch; the remaining audience depends on cron.
- The daily send limit (F-03) and per-day analytics (F-02) share an `updatedAt`
  metric weakness described in the webhook/analytics audit.

## Unverified

Live Resend submission, rate-limit behaviour under load, and crash-recovery
behaviour require a staging environment. No emails were sent during this audit.
