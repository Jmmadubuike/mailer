# Resend & Sending Domain Audit

## Architecture (verified by source)

- Account-level `RESEND_API_KEY` is used only for domain management
  (register/list/get/verify) via `getManagementClient()`.
- Sending uses a per-domain API key resolved at send time in
  `getClientForSendingDomain()`, decrypted from `SendingDomain` with
  AES-256-GCM.
- `sendThroughDomain()` resolves the domain's own client, so a campaign can
  never send through a different domain than the one it references.

## Domain lifecycle

- Register: `createDomain()` normalizes the domain, rejects duplicates, calls
  `getOrCreateProviderDomain()`, and stores DNS records.
- Verify: `triggerVerification()` calls Resend `domains.verify` and refreshes
  status; `domain.updated` webhooks also sync status.
- Sendability gates (`assertSendableDomain`): active, not emergency-stopped,
  `verificationStatus === "verified"`, credentialStatus not invalid/revoked, and
  sender email domain equals the selected domain.
- Deactivate/emergency-stop/credential invalidation all flow back into the
  sendability gate.

## Multi-domain capability: VERIFIED WORKING

- `Campaign` stores a single `sendingDomainId`; `CampaignRecipient` and
  `DeliveryJob` also store `sendingDomainId`.
- Dispatch and each worker job re-call `assertSendableDomain`.
- `getSendableOptions()` (the campaign sender picker) returns only verified +
  active + non-stopped domains with acceptable credentials.
- Therefore each campaign can independently select a different verified domain,
  and the choice is enforced end to end. This is not merely cosmetic.

## Findings

- F-16 · P3 · Domain selection is correctly single-domain per campaign; no
  cross-domain failover exists (intentional and good).
- API keys are never returned by any endpoint (only `apiKeyHint`).
- `maskApiKey()` prefixes `re_` even for non-Resend-looking keys; cosmetic only.
- A domain's `credentialStatus` flips to `invalid` on 401/403/forbidden during
  delivery (good), but there is no automated re-test prompt beyond the UI.

## Unverified

Live registration, DNS verification, and send success could not be exercised
without a staging Resend account and DNS control. The integration logic is
complete and consistent by inspection.
