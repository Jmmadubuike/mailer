# Scheduling

Scheduled campaigns are dispatched by a cron endpoint that claims due campaigns
atomically, resolves the audience at dispatch time (so unsubscribes after
scheduling are honored), snapshots recipients, and creates durable delivery
jobs.

The worker claims a bounded batch of jobs with a run id and lease, applies
exponential backoff to retryable failures, and never retries permanent
failures. Idempotency is guaranteed by a unique recipient constraint, unique
job keys, and a provider-message-id check before sending.

See `docs/EMAIL_DELIVERY.md` for the full flow and Vercel Cron setup.
