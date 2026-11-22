# Unsubscribe & Suppression Audit

## Implementation

- Each rendered email includes a signed `unsubscribe_url` (HMAC over
  `recipientId:email`) and `List-Unsubscribe` / `List-Unsubscribe-Post` headers
  with the same token.
- `POST /api/unsubscribe` and `/api/unsubscribe/one-click` verify the token,
  create/refresh an organization-wide `unsubscribe` suppression, set the
  contact's `status` to `unsubscribed`, and update the recipient.
- `resolveAudience` excludes all `scope:"all"` suppressions plus list-scoped
  suppressions for the selected lists, and requires `status === "subscribed"`.
- Bounce and complaint webhooks create `scope:"all"` suppressions.

## Compliance posture

- Suppressed and unsubscribed contacts are excluded from new campaign
  dispatches by both the suppression table and contact status (defense in
  depth).
- Unsubscribe is one-click, does not require login, and is idempotent.

## Findings

- F-01 · P1 · Race window: suppression is enforced only at dispatch time.
  `CampaignRecipient` rows are snapshotted when the campaign is queued, and the
  worker does not re-check suppression before the provider call. A contact who
  unsubscribes after dispatch but before their job is claimed/sent can still be
  emailed. Window is typically seconds-to-minutes but is a genuine compliance
  and reputation risk.
- F-09 · P3 · `DELETE /api/suppressions/:id` (owner) removes a bounce/complaint
  suppression but does not change the contact's `status`; for bounces/complaints
  the contact is still `subscribed`, so removal immediately re-enables sending
  to an address that previously bounced/complained.
- F-10 · P3 · Contact `status` and `Suppression` can diverge (see contact audit).
- F-14 · P3 · List-scoped suppression is modeled but unused.

## Positive

Re-subscription does not silently happen on import/update: import `update` mode
never resets an opt-out status, and `add-contacts` uses `$setOnInsert` so
existing unsubscribed contacts stay unsubscribed.
