# Functionality Audit

Legend: WORKING / PARTIALLY WORKING / NOT WORKING / NOT IMPLEMENTED /
CANNOT VERIFY.

## Authentication & session

- Login (valid credentials): WORKING — verified HTTP 200; session cookie set.
- Login (invalid credentials): PARTIALLY WORKING — authentication correctly
  rejects, but the route returns 500 instead of 401 and the form shows a generic
  message (FUN-01).
- Logout: WORKING — clears cookie and redirects.
- Session persistence (12h, httpOnly JWT): WORKING (source verified).
- Password reset request: PARTIALLY WORKING — returns success correctly, but
  without a verified sending domain the reset email is only logged (FUN-06).
- Password reset submit: WORKING (source verified; not executed to avoid data
  mutation).

## Dashboard data pages

- Overview: WORKING (renders counts, recent campaigns/activity, chart).
- Analytics: WORKING (200; aggregates render). Scale behaviour unverified.
- Campaigns list: WORKING. Pagination NOT IMPLEMENTED.
- Campaign detail: WORKING for valid ids; invalid id → 500 (FUN-05).
- Campaign create: PARTIALLY WORKING — blocked with no guidance when no
  verified domain exists (FUN-07); otherwise wired end-to-end.
- Contacts: WORKING (list, search, paginate, create, status update, delete,
  bulk delete, export). Delete lacks confirmation (SEC-01).
- Contacts import: WORKING (parse → map → confirm → report), verified at source;
  end-to-end import NOT executed to avoid creating data.
- Lists: WORKING (create, add contacts). No edit/delete of a list (NOT
  IMPLEMENTED).
- Segments: WORKING (create with condition builder, estimate, delete).
- Sending domains: WORKING (register, edit, verify, test, stats, activate,
  deactivate, emergency stop) — the richest module; verified 200 responses.
- Settings: WORKING (toggle save, daily limit save).
- Suppressions: WORKING (list, remove).
- Team: WORKING (invite, role change, disable/enable, reset password, remove).
- Templates: WORKING (read-only, code-defined).
- Audit logs: WORKING (list only; no filter/pagination).

## Interactive inventory (summary)

Buttons: primary actions, secondary actions, destructive actions, toggles,
editor toolbar, pagination, tabs. Links: sidebar nav, campaign names, back
links, footer links. Forms: login, reset, campaign, contact create, list
create, segment builder, domain add/edit, settings, team invite, import
columns. Modals/dialogs: contact create, list add-contacts, segment create,
domain add/edit/test/stats, team invite/password, campaign test. Tables: 8 data
tables. Charts: engagement line chart. Uploads: import file. Downloads: CSV
export (contacts, campaign recipients).

## Functional defects

### FUN-01 — `AppError` not translated to HTTP status on login

- Severity: P2 · Route: `POST /api/auth/login`
- Current: invalid credentials throw `AppError("Invalid email or password", 401)`
  with no catch; Next returns 500. Malformed JSON similarly returns 500 instead
  of 400.
- Expected: 401 with the JSON `{ error }` body (and 400 for malformed JSON).
- Reproduce: `POST /api/auth/login` with a wrong password → status 500.
- Files: `src/app/api/auth/login/route.ts`, `src/lib/api.ts`.
- Recommendation: catch `AppError` and return `{ error, status }`; or add a
  shared error-handling wrapper for route handlers.

### FUN-02 — Role-blind navigation and stale placeholder

- Severity: P2 · `dashboard-shell.tsx`
- Current: all nav links render for every role; non-permitted destinations
  redirect to `/dashboard` on click (server-enforced, so not a security hole),
  producing dead links. A "rich-text editor coming in later phases" note is
  stale.
- Expected: filter links by role; remove the stale note.

### FUN-03 — Missing confirmation on destructive actions

- Severity: P1 · contacts, suppressions, team
- Current: single delete, bulk delete, suppression remove, and team
  disable/remove execute immediately. Campaign delete does use `window.confirm`,
  demonstrating the intended pattern.
- Expected: confirm before any irreversible mutation.
- Files: `contacts-manager.tsx`, `suppressions-manager.tsx`, `team-manager.tsx`.

### FUN-04 — No loading/pending states on several mutations

- Severity: P3 · contacts, segments, lists
- Current: several delete/update buttons don't disable while in-flight and pages
  have no route-level `loading.tsx`; after a click the UI relies on
  `router.refresh()`.
- Expected: disabled/pending states and skeleton or loading UI.

### FUN-05 — Invalid ObjectId → unhandled 500

- Severity: P2 · `GET /dashboard/campaigns/[id]`, `GET/PATCH/DELETE
  /api/campaigns/[id]`, `/api/contacts/[id]`, `/api/lists/[id]/add-contacts`
- Current: a malformed `:id` triggers a Mongoose CastError and returns 500
  instead of 404/400.
- Expected: validate ids (e.g., `mongoose.isValidObjectId`) and return 404.

### FUN-06 — Password reset silently depends on a sending domain

- Severity: P2 · `POST /api/auth/forgot`
- Current: the reset email is only sent when a verified, active sending domain
  exists; otherwise the URL is written to the server log and the user still sees
  "a reset link has been sent".
- Expected: either guarantee a fallback sender or surface the limitation.

### FUN-07 — Campaign creation dead-end without a verified domain

- Severity: P2 · `/dashboard/campaigns/new`
- Current: with no verified domain, the select shows "No verified domains" and
  the user cannot proceed, with no guidance.
- Expected: an inline call-to-action linking to Sending Domains.

### FUN-08 — Email composer tabs lack tab semantics

- Severity: P3 · `email-composer.tsx`
- Current: Visual/HTML/Preview are plain buttons with no `role="tablist"` /
  `aria-selected`.
- Expected: proper tab semantics for assistive tech.

## CANNOT VERIFY

- Actual Resend domain registration/verification and email delivery (requires
  external DNS + live send).
- Webhook ingestion and event reconciliation (requires provider events).
- Scheduler/worker cron endpoints (require `CRON_SECRET` and would enqueue real
  work).
- Import and bulk-delete end-to-end (would create/modify production data).
