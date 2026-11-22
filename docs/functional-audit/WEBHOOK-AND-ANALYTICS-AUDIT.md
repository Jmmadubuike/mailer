# Webhook & Analytics Audit

## Webhook ingestion

- Signature verification: WORKING — `Resend().webhooks.verify` with
  `RESEND_WEBHOOK_SECRET`; missing secret returns 503; invalid signature 401.
- Deduplication/idempotency: WORKING — `WebhookEvent.eventId` (svix-id) is
  unique; duplicates are skipped.
- Event persistence: WORKING — every event is stored before processing and
  marked `processedAt`.
- Attribution: WORKING — `email.*` events are matched to `CampaignRecipient`
  by `providerMessageId`; `domain.updated` syncs domain verification status.
- Supported email events: sent, delivered, bounced, complained, opened,
  clicked, delivery_delayed, failed, plus unsubscribed handling.
- Bounce/complaint create organization-wide suppressions (good).

## Analytics

- Campaign report and domain stats count unique events via the recipient
  `events` array (`events: "delivered"`, etc.), so opens/clicks are unique per
  recipient. Total (repeat) engagement is not tracked (F-11).
- `getEngagementSeries` produces a 14-day chart.

## Findings

- F-02 · P2 (broken) · The per-day "sent" series groups by `$updatedAt`. Any
  later webhook update (delivered/opened/clicked) changes `updatedAt`, so a
  recipient sent on day 1 but opened on day 5 is counted as "sent" on day 5.
  There is no dedicated `sentAt` field to group by, making the sent-by-day chart
  materially inaccurate.
- F-03 · P2 · The daily send limit counts recipients with a provider message id
  and `updatedAt >= startOfDay`, so it both over-counts (webhook-updated older
  recipients) and is non-atomic under concurrent workers.
- F-05 · P2 · Webhook events are processed in arrival order, not chronological
  order. A late `delivered` overwrites `opened`/`clicked` (the delivered branch
  always assigns `delivered`), regressing the recipient status.
- F-11 · P3 · No total-vs-unique distinction for opens/clicks.

## Accuracy statement

Delivery and engagement metrics are based on actual provider events, not
assumptions. The unique-event counts are sound; the day-bucketed "sent" series
is the one demonstrably inaccurate calculation.
