# Page-by-Page Findings

Finding format: ID · severity · page · component · problem → recommendation.

## Public pages

### /login

- P-01 · P3 · `src/app/login/page.tsx`, `src/components/auth/login-form.tsx` ·
  Generic "Mailer" branding; no product logo/identity → apply real brand.
- P-02 · P2 · `src/app/api/auth/login/route.ts` · Invalid credentials throw
  `AppError(401)` without a catch, so the endpoint returns HTTP 500 and the form
  falls back to the generic "Login failed" message → wrap in try/catch and map
  `AppError` to its status. (See FUN-01.)
- P-03 · P2 · `login-form.tsx` · Inputs have proper `<label htmlFor>` (good);
  the password toggle has `aria-label` (good). No `autofocus` and no
  `aria-invalid`/`aria-describedby` on error → add error association.
- P-04 · P3 · `login-form.tsx` · Submit button only shows a text change
  ("Signing in…") with no spinner; acceptable but a spinner is clearer.

### /reset

- P-05 · P3 · `reset-form.tsx` · Request flow is clean and anti-enumeration
  ("If that address exists…"). When no verified sending domain exists, the reset
  email is only logged server-side (see FUN-06), so a user cannot complete the
  reset → surface the limitation or fall back to a development link.
- P-06 · P3 · `reset-form.tsx` · Email input uses placeholder only (no label) →
  add a label. (See A11Y-01.)

### /unsubscribe

- P-07 · P2 · `unsubscribe-client.tsx` · Clean invalid/done/confirm states;
  well-written copy. The email in the confirm state is rendered inline rather
  than announced; minor.

## Dashboard shell (all pages)

- P-08 · P1 · `src/components/layout/dashboard-shell.tsx` · Fixed `w-64`
  sidebar with `ml-64` main content and no breakpoint or toggle → unusable on
  mobile. (See MOB-01.)
- P-09 · P2 · `dashboard-shell.tsx` · Sidebar lists every link regardless of
  role; viewer/campaign_manager see admin links that redirect away. (See FUN-02.)
- P-10 · P2 · `dashboard-shell.tsx` · No active-route highlight on nav links →
  add `usePathname()` active state.
- P-11 · P2 · `dashboard-shell.tsx` · "Coming in later phases — the rich-text
  editor" is stale; the editor now exists. Remove or update.
- P-12 · P3 · `dashboard-shell.tsx` · `user.email` and "Sign out" use
  `text-slate-400` on `bg-slate-900` (low contrast). (See A11Y-05.)

## /dashboard (Overview)

- P-13 · P3 · `src/app/dashboard/page.tsx` · Stat cards and recent
  campaigns/activity are clear. `campaign.recipientCount` is shown raw without
  formatting; fine.
- P-14 · P3 · `page.tsx` · Engagement chart renders via Recharts with a
  14-day series; no empty-state treatment for a fresh database (chart simply
  shows zeroes) → acceptable, but an empty-state hint would be nicer.

## /dashboard/analytics

- P-15 · P3 · `analytics/page.tsx` · Stat grid uses
  `grid-cols-2 sm:grid-cols-4 lg:grid-cols-7`; at `lg` the seven cards get very
  narrow → use `xl:grid-cols-7` and allow wrapping.
- P-16 · P2 · `analytics/page.tsx` · Per-domain table is wrapped in
  `overflow-x-auto` (functional) but has no mobile alternative. (See MOB-02.)

## /dashboard/campaigns

- P-17 · P3 · `campaigns/page.tsx` · Table with name/subject/domain/status/
  recipients/created; status pill is always slate regardless of state → color
  by status for scannability. (See CONS-05.)
- P-18 · P3 · `campaigns/page.tsx` · No pagination on the campaign list (all
  campaigns fetched) → add pagination/search as volume grows.

## /dashboard/campaigns/new

- P-19 · P2 · `campaign-create-form.tsx` · If there are no verified sending
  domains, the sender select shows "No verified domains" and the form cannot
  proceed, with no link/guidance to add one → add onboarding hint. (See FUN-07.)
- P-20 · P3 · `campaign-create-form.tsx` · "Send immediately" has no
  confirmation step despite sending to a real audience → consider a summary
  confirmation. (See SEC-01.)
- P-21 · P3 · `campaign-create-form.tsx` · "Start from a template" select
  populates subject + HTML but not preview text → minor; could map previewText.

## /dashboard/campaigns/[id]

- P-22 · P2 · `campaigns/[id]/page.tsx` · Invalid `id` (non-ObjectId) throws a
  Mongoose cast error and returns an unhandled 500 → validate ids or catch
  errors. (See FUN-05.)
- P-23 · P3 · `campaign-actions.tsx` · Action buttons and test dialog work;
  "Send now" lacks confirmation. The modal has no focus management. (See
  A11Y-02.)

## /dashboard/contacts

- P-24 · P2 · `contacts-manager.tsx` · Single and bulk delete run immediately
  with no confirmation → add confirmation. (See SEC-01.)
- P-25 · P2 · `contacts-manager.tsx` · Status `<select>` and Delete button have
  no accessible label; the select relies on visual context. (See A11Y-01.)
- P-26 · P3 · `contacts-manager.tsx` · Pagination is Previous/Next only; no
  page-number or total controls; acceptable but basic.
- P-27 · P3 · `contacts-manager.tsx` · "Add contact" dialog fields use
  placeholders without labels. (See A11Y-01.)

## /dashboard/contacts/import

- P-28 · P3 · `import-wizard.tsx` · Well-structured 3-step wizard with mapping,
  custom fields, duplicate handling, and consent. File input is a bare native
  control without a styled drop zone → improve drag-and-drop affordance.
- P-29 · P2 · `import-wizard.tsx` · Consent checkbox and duplicate-mode radios
  are wrapped in labels (good); the "Add custom field" and "×" buttons are
  small touch targets. (See MOB-04.)

## /dashboard/lists

- P-30 · P3 · `lists-manager.tsx` · New-list form and list cards are clean; no
  list detail/edit/delete beyond adding contacts. "Add contacts" modal has no
  focus management. (See A11Y-02.)

## /dashboard/segments

- P-31 · P2 · `segments-manager.tsx` · Condition rows use fixed `w-44`/`w-40`
  inputs in an unwrapped `flex` row → horizontal overflow on narrow screens.
  (See MOB-03.)
- P-32 · P3 · `segments-manager.tsx` · Field/operator/value inputs have no
  labels; the datalist is a partial affordance. (See A11Y-01.)

## /dashboard/sending-domains

- P-33 · P3 · `sending-domains-manager.tsx` · The richest page in the app:
  combined stats, per-domain actions, verification, test, stats dialogs. A good
  reference for the desired quality bar elsewhere.
- P-34 · P2 · `sending-domains-manager.tsx` · `Field` renders a `<label>`
  without `htmlFor`, so inputs are not programmatically associated. (See
  A11Y-01.)
- P-35 · P3 · `sending-domains-manager.tsx` · Action buttons are compact
  (`px-2.5 py-1`) — small touch targets. (See MOB-04.)

## /dashboard/settings

- P-36 · P3 · `settings-manager.tsx` · Toggle uses `role="switch"` and
  `aria-checked` (good). Daily limit saves on blur with no confirmation/error
  surface beyond a generic toast → acceptable.
- P-37 · P2 · `settings-manager.tsx` · Number input has no label association
  (label is a sibling `SettingRow` text). (See A11Y-01.)

## /dashboard/suppressions

- P-38 · P2 · `suppressions-manager.tsx` · "Remove" runs immediately with no
  confirmation → add confirmation. (See SEC-01.)

## /dashboard/team

- P-39 · P2 · `team-manager.tsx` · Role change `<select>` has no label; action
  buttons are tiny; Disable/Enable and Remove have no confirmation → improve
  labels and add confirmation for Remove/Disable. (See A11Y-01, SEC-01.)
- P-40 · P3 · `team-manager.tsx` · Uses its own `Dialog`, `inputClass`,
  `primaryClass`, `secondaryClass` duplicated from elsewhere. (See CONS-03.)

## /dashboard/templates

- P-41 · P3 · `templates-manager.tsx` · Read-only catalog view (code-defined
  templates). Clear and correctly states that templates are managed in code.
  No edit/preview affordance in-app (intentional).

## /dashboard/audit-logs

- P-42 · P3 · `audit-logs/page.tsx` · Simple, capped at 100 rows, no
  pagination/filter → acceptable for now; add filtering as volume grows.
