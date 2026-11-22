# Test Coverage Report

## Existing automated tests

- Framework: Vitest 5 (`npm run test`)
- Files: 4, tests: 21, all passing.
- Covered units:
  - `src/lib/utils/csv.test.ts` — CSV parsing/quoting
  - `src/modules/personalization/render.test.ts` — template variable rendering
  - `src/modules/segments/evaluate.test.ts` — segment condition evaluation
  - `src/modules/unsubscribe/token.test.ts` — unsubscribe token sign/verify
- Type safety: `tsc --noEmit` passes.
- Linting: ESLint passes.

## Gaps

- No component or route tests (all UI/API behaviour is untested automatically).
- No E2E/browser tests (no Playwright/Cypress).
- No tests for auth flow, campaigns, contacts, sending domains, settings, team,
  imports, or webhooks.
- No accessibility (axe) or visual-regression tests.

## Recommendations

1. Add Vitest + React Testing Library tests for shared primitives (once the
   design system exists).
2. Add API route tests for auth (login success/failure status codes), contacts,
   and campaigns using a test database.
3. Introduce Playwright for the critical journeys (login, campaign create,
   contact import, domain setup) and run at the 13 audited viewports.
4. Add axe-core checks to the E2E suite.
