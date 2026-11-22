# Staging Test Evidence

## Local automated regression (executed)

- `npm run typecheck` → exit 0
- `npm run lint` → exit 0 (no errors/warnings)
- `npm run test` → exit 0, Vitest 8 files / 34 tests passed
- After staging guard: `npm run test` → exit 0, Vitest 9 files / 39 tests
  passed; `npm run typecheck` → exit 0; `npm run lint` → exit 0.

Test files executed:

- `src/lib/utils/csv.test.ts` — CSV escaping and formula-injection guard
- `src/modules/personalization/render.test.ts` — template variable rendering
- `src/modules/segments/evaluate.test.ts` — segment evaluation
- `src/modules/unsubscribe/token.test.ts` — unsubscribe token sign/verify
- `src/modules/webhooks/status.test.ts` — monotonic recipient status
- `src/modules/delivery/suppression.test.ts` — suppression decision logic
- `src/modules/settings/limits.test.ts` — daily quota key and acceptance
- `src/modules/users/ownership.test.ts` — last-owner guard
- `src/lib/staging/guard.test.ts` — staging env detection + recipient allow-list

## External tests

Not executed. No staging Resend account/domain, webhook secret, or controlled
staging recipients were available. No emails were sent, no domains were
registered, and no database records were created or modified during this run.

## Evidence references

- Environment validation output captured at execution start (branch, commit,
  env-file inventory, masked variable state).
- Exit codes for typecheck/lint/test recorded as 0.
- Prior authenticated route spot-checks (all 14 dashboard routes 200) were
  performed earlier in this workspace; no further database-mutating HTTP calls
  were made during staging validation.
