# Staging Readiness & Delivery Safety Review

This review inspected the implemented remediation in place. No emails were
sent, no production data, Resend configuration, or environment variables were
modified, no dependencies were added, and nothing was deployed. Local checks:
`tsc --noEmit` pass, ESLint pass, Vitest 8 files / 34 tests pass, and an
authenticated spot-check of dashboard routes returns 200.

## Area classification

### 1. Atomic daily quota reservation and release under concurrency

READY FOR STAGING.

`reserveDailySend()` atomically increments a per-day counter document and
rejects (with a compensating decrement) when the configured limit would be
exceeded. `releaseDailySend(key)` now decrements the exact reserved key, closing
the day-boundary race where a reservation made before midnight could be
released against the next day's counter. Residual notes: the configured limit
is read outside the reservation transaction (a concurrent settings change can
lag by one request), and counter documents accumulate per day (harmless, small).
Tested: `limits.test.ts` (key format and acceptance boundary).

### 2. Provider submission idempotency and ambiguous network failures

READY FOR STAGING.

Each send now passes the job's stable `idempotencyKey`
(`campaignId:recipientId`) as Resend's `Idempotency-Key` header, in addition to
the local `providerMessageId` guard and the unique `(campaignId,email)`
recipient snapshot. A timeout that actually succeeded at Resend will return the
same message id on retry rather than duplicate. Residual note: this relies on
Resend honoring the header; verify with a forced timeout/retry in staging.

### 3. Suppression checks and recipient state consistency

READY WITH DOCUMENTED RISK.

The worker re-checks global suppressions and contact status immediately before
submission; suppressed recipients are recorded (`suppressed`/`unsubscribed`)
with the job marked `skipped`, and a database failure during the check fails
retryably rather than permitting delivery. The only residual risk is the
unavoidable sub-second window between the final database check and the provider
call. Tested: `suppression.test.ts` (decision logic).

### 4. Worker lease expiration and crash recovery

READY FOR STAGING.

`recoverStaleJobs()` resets expired `processing` jobs to `pending` before each
claim pass. Re-claiming is safe: if the prior attempt recorded a provider
message id, the idempotency guard skips; if not, the provider idempotency key
prevents a duplicate. The lease (5 minutes) plus idempotency cover crash
recovery.

### 5. Webhook signature verification, deduplication and event ordering

READY FOR STAGING.

Signatures are verified with `RESEND_WEBHOOK_SECRET`, events are deduplicated by
the unique `eventId`, and recipient updates now use atomic MongoDB pipeline
updates so concurrent opened/clicked events cannot lose counter increments or
regress status. Status transitions are rank-monotonic. Residual note: two
simultaneous deliveries of the same event id can transiently surface a 500
(duplicate-key) that Resend then retries; the event is deduplicated and the
retry is acknowledged. Tested: `status.test.ts`.

### 6. Scheduled campaign recovery

READY WITH DOCUMENTED RISK.

A failed scheduled dispatch reverts `queued -> scheduled` (so it is never
mislabeled `sent`), and zero-recipient campaigns finalize to `failed`. Residual
risk: a persistently failing scheduled campaign retries on every scheduler run
with no backoff or max-retry ceiling. Recommend a max-dispatch-attempts guard in
a follow-up.

### 7. Multi-domain credential isolation

READY FOR STAGING.

Unchanged and verified: each campaign, recipient, and delivery job stores its
`sendingDomainId`; the per-domain API key is resolved and decrypted only for
that domain; the sender email must belong to the selected domain. No cross-
domain failover exists.

### 8. Accurate campaign completion and recipient accounting

READY FOR STAGING.

`finalizeCampaign` marks `partially_failed` when any job failed and `sent` only
when none failed and at least one recipient exists; zero-recipient campaigns
become `failed`. Suppression-skips are `skipped` (not failed), and analytics
counts only recipients with a provider message id, so skips do not inflate
"sent". Total opens/clicks are tracked separately from unique events.

## Staging execution checklist

Do not execute against production. Execute in this order.

1. **Domain**: register + verify a staging Resend domain; attach its sending
   API key in Sending Domains.
2. **Small send**: create a campaign to one controlled mailbox and send; expect
   recipient `sent`, provider message id present, campaign eventually `sent`.
3. **Webhooks**: trigger real delivered/bounced/complained/opened/clicked
   events; expect status progression, bounce/complaint suppression, dedup, and
   open/click counters incrementing.
4. **>100 recipients**: send to 101+ test addresses; expect the first batch of
   `WORKER_BATCH_SIZE` synchronously and the remainder drained by cron, with no
   duplicates and final status accurate.
5. **Crash recovery**: kill a worker mid-batch and run the worker again; expect
   stale `processing` jobs recovered and no duplicate delivery.
6. **Suppression race**: unsubscribe a recipient after dispatch but before the
   worker sends; expect the recipient skipped and recorded `unsubscribed`.
7. **Daily limit**: set a small daily limit and run concurrent workers; expect
   no more than the limit accepted, with the rest retried.
8. **Idempotency**: force a provider timeout and retry; expect a single email.

## Required environment variables (staging)

`DATABASE_URL`, `AUTH_SECRET`, `CREDENTIALS_ENCRYPTION_KEY`,
`RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`, `APP_URL`,
`WORKER_BATCH_SIZE`.

## Required test accounts

Owner, administrator, campaign_manager, and viewer accounts to verify role
boundaries; plus a controlled recipient mailbox and a disposable "bad" domain
credential to verify failure classification.

## Expected results

No duplicate sends, suppressed recipients never emailed, daily limit respected
under concurrency, accurate `sent`/`partially_failed`/`failed` states, webhook
metrics matching provider events, and correct 4xx/401/409 error codes.

## Rollback procedures

Remediation is additive (new statuses, fields, and helper modules); rolling
back is a code revert of the changed files. No destructive migration is
required: `sentAt`, `openCount`, `clickCount` default safely, and the new
`skipped`/`suppressed` enum values are backward-compatible strings. If the daily
counter behaves unexpectedly, delete the `daily_send_counter:*` and
`login_fail_*` `ApplicationSetting` documents and re-run the worker.

## Conclusion

All eight areas are READY FOR STAGING or READY WITH DOCUMENTED RISK as noted.
Staging readiness is not production readiness: completion of the checklist above
with a controlled staging Resend account is still required before production
sends.
