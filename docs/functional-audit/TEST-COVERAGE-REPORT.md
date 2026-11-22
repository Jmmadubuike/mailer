# Test Coverage Report
## Existing automated tests (executed)
- Framework: Vitest 5.
- Files: 4, tests: 21, all passing at audit time.
- Coverage: CSV serialization, personalization rendering, segment condition
  evaluation, unsubscribe token sign/verify.
- Static checks: `tsc --noEmit` and ESLint pass.
## Coverage gaps
- No automated tests for: authentication/login-lockout, authorization
  boundaries, campaign lifecycle and state transitions, delivery queue
  claim/lease/retry/finalize, webhook processing and dedup, suppression
  enforcement, import service, sending-domain sendability, or settings limits.
- No API contract tests and no browser/E2E suite.
- No mock of the Resend SDK, so delivery and webhook paths are entirely
  untested automatically.
## Required staging/manual tests (cannot run here)
1. Register + verify a test domain in a staging Resend account and confirm DNS.
2. Send a small test campaign and verify provider message ids and status
   transitions.
3. Trigger real Resend webhooks (delivered/bounced/complained/opened/clicked)
   and verify recipient status, suppression creation, and dedup.
4. Send beyond `WORKER_BATCH_SIZE` and confirm the cron worker drains the queue
   without duplicates.
5. Kill a worker mid-batch and verify lease recovery (currently absent — F-04).
6. Unsubscribe between dispatch and send to observe the F-01 race.
## Recommendation
Add unit tests for `queue.ts`, `dispatch.ts`, `process.ts`, `resolveAudience`,
and `settings.assertSendingEnabled` with a mocked Resend client, then an E2E
suite (Playwright) for the critical journeys before production sends.
