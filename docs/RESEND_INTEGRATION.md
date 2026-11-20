# Resend integration

All provider access is centralized in `src/lib/resend`. Domain registration,
verification, and status refresh use the account-level `RESEND_API_KEY`.
Actual sending uses a per-domain API key resolved from the encrypted
`SendingDomain` record at send time.

Prefer domain-restricted `sending_access` keys created in the Resend dashboard;
the permission and domain restriction cannot be changed via the API after
creation, so the application stores the pasted key rather than minting it.

Webhooks are verified with the SDK `webhooks.verify` method using
`RESEND_WEBHOOK_SECRET`, deduplicated by the `svix-id` header, and correlated
back to recipients by the provider message ID. `domain.updated` events keep the
verification status in sync.
