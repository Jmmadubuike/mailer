# Contact Management Audit

## Capability status

- Individual create: WORKING (email validated + lowercased; duplicate returns
  an error — see F-06 for status-code defect).
- Update: WORKING (PATCH first/last/tags/status).
- Delete: WORKING (also removes list memberships); bulk delete WORKING
  (owner/administrator only).
- Import: WORKING (client parses CSV/XLSX; server re-validates, enforces
  `confirmConsent`, 10,000-row cap, email validation, in-file dedupe, and
  skip/update/new_only duplicate modes).
- Export: WORKING (CSV of email/first/last/status/tags).
- Lists: create + add-contacts WORKING with unique `(contactId,listId)`
  membership; list edit/delete NOT IMPLEMENTED.
- Segments: create + estimate + delete WORKING; condition tree evaluated in
  `resolveAudience`.

## Data-integrity behaviour

- Import `update` mode never overwrites an existing opt-out status (it only
  updates first/last/tags/customFields and explicitly avoids `status`). This is
  a correct, important safeguard.
- `add-contacts` uses `$setOnInsert` so existing contacts are not demoted to
  `subscribed`.
- Email is the single canonical key across Contact, Suppression, and
  CampaignRecipient (lowercased).

## Findings

- F-10 · P3 · A contact's `status` and `Suppression` rows can diverge: the UI
  can set `status = "suppressed"` without writing a Suppression row, while
  bounce/complaint write a Suppression row without changing `status`. Audience
  resolution handles both, but the two sources of truth can disagree.
- F-14 · P3 · List-scoped suppressions (`scope: "list"`) exist in the schema
  but are never created; only organization-wide suppressions are used.
- F-13 · P3 · RESOLVED (verified during implementation) — `csvEscape` prefixes
  formula-leading cells with `'`; covered by existing `csv.test.ts` tests.

## Verification limits

Import, bulk delete, and list membership were inspected at source and unit
tests exist for CSV utilities; live import was not executed to avoid creating
production records.
