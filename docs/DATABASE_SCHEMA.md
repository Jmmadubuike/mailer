# Database schema

MongoDB via Mongoose 9. Collections:

- `users` — administrative accounts and roles.
- `contacts` — central contact database (unique normalized email).
- `mailinglists` — independent lists.
- `listmemberships` — unique contact/list pairs.
- `segments` — reusable audience filters (stored as a condition tree).
- `campaigns` — campaign config, sender identity, and a required `sendingDomainId`.
- `campaignrecipients` — one row per recipient with `sendingDomainId`,
  `providerMessageId`, and an `events` array for unique engagement counts.
- `sendingdomains` — domain registry with encrypted API key fields.
- `emailtemplates` — reusable templates.
- `suppressions` — unsubscribe/complaint/bounce records.
- `deliveryjobs` — durable delivery jobs with leases and idempotency keys.
- `webhookevents` — deduplicated provider events.
- `auditlogs` — administrative activity.
- `applicationsettings` — non-secret platform settings.

Key indexes cover normalized email, status, memberships, campaign status,
scheduled timestamps, provider message IDs, webhook event IDs, job status, and
suppression lookups.
