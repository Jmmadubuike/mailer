# Email Branding Implementation

## Changes

- Added `src/lib/email/brand.ts`: centralized, configurable brand name
  (`EMAIL_FROM_NAME`, default "Mailer") plus two email-compatible table layouts
  with inline CSS — `brandedLayout` (marketing, color tokens + unsubscribe) and
  `transactionalLayout` (system, concrete colors). Both use a text wordmark
  header and a clean footer; no fabricated logo, address, or legal text.
- `src/modules/templates/catalog.ts`: starter templates now render through
  `brandedLayout`; removed the "SPRAY N SNIFF"/"Spraynsniff" placeholder and the
  fabricated physical address.
- `src/app/api/auth/forgot/route.ts`: password-reset email now uses
  `transactionalLayout` with a branded CTA and a plain-text alternative.
- `src/lib/resend/send.ts`: sender identity now falls back explicitly —
  From name `input.fromName → domain.defaultSenderName → EMAIL_FROM_NAME`; From
  address `input.fromEmail → domain.defaultSenderAddress → EMAIL_FROM_ADDRESS →
  mail@domain`; Reply-To `input.replyTo → domain.defaultReplyTo →
  EMAIL_REPLY_TO`.

## Verification (actual provider evidence)

A campaign sent from the Newsletter template was fetched via Resend
`emails.get`:

- `from`: `Mailer <hello@mail.josephmmadubuike.com>`
- `reply_to`: `[jmmadubuike@gmail.com]`
- subject personalized (`{{first_name}}` resolved)
- brand wordmark present; no placeholder brand, no fabricated address, and no
  unresolved `{{...}}` tokens in the delivered HTML.

## Tests

`tsc --noEmit` pass, ESLint pass, Vitest 10 files / 42 tests pass.
`src/lib/resend/reply-to.test.ts` covers sender-configuration precedence.

## Not verified

Real-client rendering (Outlook, Apple Mail, desktop/mobile Gmail, images
blocked) was not performed; the layouts are table-based with inline CSS and use
a text wordmark, so they degrade gracefully when images are blocked, but actual
client screenshots were not captured.
