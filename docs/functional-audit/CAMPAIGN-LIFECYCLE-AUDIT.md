# Campaign Lifecycle Audit

## Creation and validation

- `createCampaignSchema` validates name, subject, sender name/email, reply-to,
  optional content, sending domain id, lists/segments, and send mode.
- `createCampaign` sanitizes HTML, asserts the sending domain is sendable,
  checks for a duplicate draft name, and persists the campaign.
- Sender email must belong to the selected domain (enforced in
  `assertSendableDomain`).

## State transitions

- `draft` (default) → `queued` (dispatch) → `sending` (first successful send)
  → `sent` or `partially_failed` (no remaining jobs).
- `scheduled` → `queued` via scheduler; `cancelled` stops future dispatch and
  cancels pending/retry/processing jobs.
- `failed` when the resolved audience is empty.
- `preparing` is declared in the enum but never assigned; dead state.

## Capability status

- Draft save, send now, schedule, reschedule (name/scheduledAt), duplicate,
  cancel, delete, test email: WORKING.
- Duplicate copies content + audience and starts as draft.
- Test email renders personalization with a sample context and sends via the
  campaign's domain to an arbitrary verified input.
- Recipient selection is lists and/or segments; both are unioned, deduplicated,
  and filtered by `subscribed` status and suppressions in `resolveAudience`.

## Findings

- F-15 · P2 · `sendMode === "now"` performs audience snapshot + one
  `processQueue()` batch (up to `WORKER_BATCH_SIZE`, default 100) synchronously
  inside the HTTP request. Larger campaigns complete only when the cron worker
  runs again; the UI reports the full queued count, which can be mistaken for
  "already sent".
- F-08 · P2 · If dispatch fails after the scheduler claims a scheduled campaign
  (`scheduled -> queued`) but before jobs are created, the campaign can be left
  in `queued` with zero jobs; `finalizeStalledCampaigns` would then mark it
  `sent` with zero recipients.
- F-12 · P3 · `PATCH /api/users/:id` lets an owner demote themselves or the
  last owner to a non-admin role; no last-owner guard exists.

## Positive

Cannot accidentally send to unintended recipients at the data layer: audience
resolution deduplicates emails, requires `subscribed` status, excludes
suppressions, and the provider call is domain-scoped and sanitized.
