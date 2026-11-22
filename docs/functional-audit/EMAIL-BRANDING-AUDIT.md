# Email Branding Audit

## Brand assets

- Present: `src/app/favicon.ico` only. No logo, image, or vector brand asset
  exists in the repository.
- Missing (not fabricated): organization logo, official brand website URL,
  physical address, telephone number, and legal/company registration text.
- Existing color system: `src/lib/templates/colors.ts` (primary indigo,
  background, text) reused across templates.

## Email-generating workflows

| Workflow | Template source | Branding state (before) |
| --- | --- | --- |
| Marketing campaigns | `src/modules/templates/catalog.ts` | Used a hardcoded "SPRAY N SNIFF" header and a fabricated "1 Example Street, Lagos, Nigeria" footer |
| Campaign test email | `src/modules/campaigns/service.ts` | Reused the campaign's own HTML |
| Password reset | `src/app/api/auth/forgot/route.ts` | Plain, unbranded HTML |
| Domain connectivity test | `src/modules/sending-domains/service.ts` | Plain, unbranded HTML (admin diagnostic) |
| Unsubscribe | web page, not email | N/A |

No registration, billing, login-notification, or account-invitation emails
exist; none were introduced.

## Sender identity

- Sources: per-message override → sending-domain default → organization-wide
  environment defaults.
- `EMAIL_REPLY_TO` was previously wired; `EMAIL_FROM_NAME` and
  `EMAIL_FROM_ADDRESS` were declared in config but not used.
- Domain-scoped sender identity is stored per `SendingDomain` and never shared
  across domains.

## Inconsistencies found

- Placeholder brand name and fabricated address in marketing templates.
- Password reset and connectivity emails lacked the brand layout.
- Organization-wide From name/address fallback was dead config.

## Production deployment risks

- No dedicated production database, Resend account/credentials, verified
  production sending domain, production webhook secret, or authorized
  production smoke-test recipient were provided.
