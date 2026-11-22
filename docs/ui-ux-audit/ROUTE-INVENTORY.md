# Route Inventory

## Public page routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Redirects to `/dashboard` |
| `/login` | `src/app/login/page.tsx` | Sign in |
| `/reset` | `src/app/reset/page.tsx` | Request reset / set new password |
| `/unsubscribe` | `src/app/unsubscribe/page.tsx` | One-click unsubscribe (token) |

## Dashboard page routes (protected by `src/app/dashboard/layout.tsx`)

| Route | File | Role gate |
| --- | --- | --- |
| `/dashboard` | `src/app/dashboard/page.tsx` | any signed-in user |
| `/dashboard/analytics` | `src/app/dashboard/analytics/page.tsx` | all roles |
| `/dashboard/audit-logs` | `src/app/dashboard/audit-logs/page.tsx` | owner, administrator |
| `/dashboard/campaigns` | `src/app/dashboard/campaigns/page.tsx` | all roles |
| `/dashboard/campaigns/new` | `src/app/dashboard/campaigns/new/page.tsx` | owner, administrator, campaign_manager |
| `/dashboard/campaigns/[id]` | `src/app/dashboard/campaigns/[id]/page.tsx` | all roles |
| `/dashboard/contacts` | `src/app/dashboard/contacts/page.tsx` | all roles |
| `/dashboard/contacts/import` | `src/app/dashboard/contacts/import/page.tsx` | owner, administrator, campaign_manager |
| `/dashboard/lists` | `src/app/dashboard/lists/page.tsx` | all roles |
| `/dashboard/segments` | `src/app/dashboard/segments/page.tsx` | all roles |
| `/dashboard/sending-domains` | `src/app/dashboard/sending-domains/page.tsx` | owner |
| `/dashboard/settings` | `src/app/dashboard/settings/page.tsx` | all roles (edit: owner) |
| `/dashboard/suppressions` | `src/app/dashboard/suppressions/page.tsx` | all roles (delete: owner) |
| `/dashboard/team` | `src/app/dashboard/team/page.tsx` | owner, administrator |
| `/dashboard/templates` | `src/app/dashboard/templates/page.tsx` | all roles |

## API route files (45)

Auth: `api/auth/login`, `api/auth/logout`, `api/auth/me`, `api/auth/forgot`,
`api/auth/reset`.

Campaigns: `api/campaigns` (GET/POST), `api/campaigns/[id]`,
`api/campaigns/[id]/cancel`, `/duplicate`, `/export`, `/recipients`, `/report`,
`/send`, `/test`.

Contacts: `api/contacts` (GET/POST), `api/contacts/[id]`,
`api/contacts/bulk-delete`, `api/contacts/export`.

Lists: `api/lists`, `api/lists/[id]/add-contacts`.
Segments: `api/segments`, `api/segments/[id]`.
Sending domains: `api/sending-domains`, `api/sending-domains/[id]`,
`/activate`, `/deactivate`, `/emergency-stop`, `/stats`, `/test`, `/verify`,
`/options`.
Settings: `api/settings`. Audit: `api/audit-logs`.
Suppressions: `api/suppressions`, `api/suppressions/[id]`.
Templates: `api/templates`, `api/templates/[id]`.
Users: `api/users`, `api/users/[id]`, `api/users/[id]/password`.
Imports: `api/imports/run`.
Internal: `api/internal/scheduler/run`, `api/internal/worker/run`.
Unsubscribe: `api/unsubscribe`, `api/unsubscribe/one-click`.
Webhooks: `api/webhooks/resend`.

## Audit status

All 18 page routes were audited. All 14 dashboard routes were verified at HTTP
200 with an authenticated owner session. The 4 public routes were verified
(login 200, reset 200, unsubscribe renders, `/` redirects). API endpoints were
inspected at source level; a representative subset was exercised at runtime.
