# Prioritized Remediation Plan (updated after implementation)

Severity: P0 = 0, P1 = 1, P2 = 8, P3 = 6.

## Implementation status

| ID | Status | Files changed | Solution | Tests | Remaining limitations |
| --- | --- | --- | --- | --- | --- |
| F-01 | RESOLVED | `models/CampaignRecipient.ts`, `models/DeliveryJob.ts`, `modules/delivery/suppression.ts`, `modules/delivery/queue.ts` | Re-check global suppression + contact status immediately before the provider call; skip → recipient `suppressed`/`unsubscribed` + job `skipped`; DB failure → retryable | `suppression.test.ts` | Sub-second race between the final check and the provider call cannot be eliminated across the DB/provider boundary; worker DB path needs staging verification |
| F-02 | RESOLVED | `models/CampaignRecipient.ts`, `modules/analytics/service.ts` | Added `sentAt`, set on first successful send; daily series groups by `sentAt` | none (DB aggregation) | Historical rows without `sentAt` are excluded from the day chart (not fabricated) |
| F-03 | RESOLVED | `modules/settings/service.ts`, `modules/settings/limits.ts`, `modules/delivery/queue.ts` | Atomic per-day counter reservation via `ApplicationSetting`; release when not sent; limit-exceeded is retryable | `limits.test.ts` | Server-local day boundary; a failed send consumes then releases its reservation |
| F-04 | RESOLVED | `modules/delivery/queue.ts` | `recoverStaleJobs()` resets expired `processing` leases to `pending` before claiming | none (DB path) | Recovery is safe because re-send is idempotent via `providerMessageId` |
| F-05 | RESOLVED | `modules/webhooks/status.ts`, `modules/webhooks/process.ts` | Rank-based monotonic status transitions; open/click counters | `status.test.ts` | None material |
| F-06 | RESOLVED | contacts routes, suppressions route, users routes, `modules/campaigns/report.ts` | ObjectId validation + AppError mapping to correct 4xx | none | A shared error-handling wrapper is still a future improvement |
| F-07 | RESOLVED | `lib/auth/throttle.ts`, `api/auth/login/route.ts` | Persistent account throttle stored in `ApplicationSetting` | none | Account-based only; IP-based throttling not implemented |
| F-08 | RESOLVED | `modules/delivery/dispatch.ts`, `modules/delivery/queue.ts` | Failed scheduled dispatch reverts `queued -> scheduled`; zero-recipient finalization marks `failed` | none | None material |
| F-09 | RESOLVED | `api/suppressions/[id]/route.ts` | Bounce/complaint suppression deletion blocked (409) | none | Owner retains `unsubscribe` removal (status still blocks re-send) |
| F-10 | RESOLVED | `api/contacts/[id]/route.ts` | Status change syncs `unsubscribe` suppression (upsert on unsubscribed, delete on subscribed) | none | `suppressed` status still enforced via contact status only |
| F-11 | RESOLVED | `models/CampaignRecipient.ts`, `modules/webhooks/process.ts`, `modules/campaigns/report.ts`, `modules/sending-domains/service.ts`, `types/sending-domain.ts` | `openCount`/`clickCount` totals tracked and exposed | none | Dashboard UI not yet extended to display total-vs-unique |
| F-12 | RESOLVED | `modules/users/service.ts`, `modules/users/ownership.ts`, `api/users/[id]/route.ts` | Last-active-owner guard on demote and delete | `ownership.test.ts` | None material |
| F-13 | ALREADY IMPLEMENTED | none | `csvEscape` already prefixes formula-leading cells | existing `csv.test.ts` | Audit correction; no change needed |
| F-14 | DOCUMENTED | none | List-scoped suppression is a schema capability with no creator/UI; left unchanged (no misleading UI) | none | Decision: keep for future use |
| F-15 | ASSESSED | none | Send-now status is already truthful (`queued`/`sending`, never `sent` until drained) | none | Optional progress indicator deferred |

## Test results (executed)

`tsc --noEmit` pass, ESLint pass, Vitest 8 files / 34 tests pass. Runtime: invalid
login returns 401, valid login returns 200, all 14 authenticated dashboard
routes return 200.

## Outstanding risks

- F-01 residual provider-boundary race (documented above).
- Worker/suppression/queue DB integration paths are verified by unit tests of
  pure logic and type/lint, not by a live database-backed test (no staging
  credentials available).
- Live Resend delivery, DNS verification, webhook ingestion, >100-recipient
  draining, and crash recovery require the staging checklist in
  TEST-COVERAGE-REPORT.md before production.
