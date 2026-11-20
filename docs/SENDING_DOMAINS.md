# Sending Domains module

The platform can send from multiple verified Resend domains, each with its own
API key and sender identity, managed from one dashboard.

## Data model

`SendingDomain` stores the domain name, the Resend provider id, the encrypted
API key (AES-256-GCM with `CREDENTIALS_ENCRYPTION_KEY`, held outside the
database), verification status, active status, an emergency kill switch, and
default sender identity fields. API keys are never returned from any API
response; only a masked hint (`re_••••abcd`) is exposed.

Every `Campaign` references a `SendingDomain`, and every `CampaignRecipient`
records both the `sendingDomainId` and the provider `messageId`.

## Delivery routing

The delivery layer resolves `sendingDomainId → decrypted API key` at send time
and instantiates a Resend client scoped to that domain. A campaign configured
for Domain A can never send through Domain B, and there is no silent failover
to another domain after a failure.

## Safety gates

Before dispatch the domain must be verified, active, not emergency-stopped, and
have non-invalid credentials. The sender email must belong to the selected
domain.

## API

- `GET/POST /api/sending-domains`
- `GET/PATCH /api/sending-domains/:id`
- `GET /api/sending-domains/options` (verified + active domains for the
  campaign sender selector)
- `GET /api/sending-domains/stats` (combined) and
  `GET /api/sending-domains/:id/stats` (per domain)
- `POST /api/sending-domains/:id/verify`
- `POST /api/sending-domains/:id/test`
- `POST /api/sending-domains/:id/activate` and `.../deactivate`
- `POST /api/sending-domains/:id/emergency-stop`

Writes are Owner-only. The campaign picker reads require Owner, Administrator,
or Campaign Manager.
