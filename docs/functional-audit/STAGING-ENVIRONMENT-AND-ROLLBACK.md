# Staging Environment & Rollback

## Environment identity established at execution start

- Repository branch: `main`
- Commit: `d08f7a3e178c922c0aadcdc1279de599921ad837`
- Working tree: dirty (the remediation changes are uncommitted on `main`)
- Local `staging` branch created from `d08f7a3` (working tree preserved)
- Env files present: `.env.local`, `.env.example` only (no `.env.staging`,
  `.env.production`, or `.env.development`)

## Configuration findings (values not exposed)

| Variable | State |
| --- | --- |
| `DATABASE_URL` | `mongodb://127.0.0.1:27017/mailer` — a local, single MongoDB; not a distinct staging database |
| `RESEND_API_KEY` | Set — the same account used for real verified domains (spraynsniff.com) and chopquick.com registration; not a dedicated staging account |
| `RESEND_WEBHOOK_SECRET` | MISSING |
| `CRON_SECRET` | Set |
| `AUTH_SECRET` | Set |
| `CREDENTIALS_ENCRYPTION_KEY` | Set |
| `APP_URL` | `http://localhost:3000` |
| `WORKER_BATCH_SIZE` | `100` |
| `APP_ENV` | NEW — `development`/`staging`/`production` |
| `STAGING_RECIPIENT_ALLOWLIST` | NEW — comma-separated allowed staging recipients |

## Staging isolation verdict

BLOCKED. No dedicated staging MongoDB, staging Resend account, staging sending
domain(s), DNS access, or explicitly designated controlled staging recipients
were available. The only configured database is local and the only Resend key
belongs to the operator's real account. External execution was therefore not
performed.

## Prerequisites to unblock

1. A separate staging MongoDB URI (or a dedicated database name) distinct from
   production and from this local `mailer` database.
2. A dedicated staging Resend account with its own account key.
3. At least one staging-only domain with DNS control for verification, or a
   clearly approved staging sending domain.
4. `RESEND_WEBHOOK_SECRET` set in the staging environment.
5. An explicit allow-list of controlled staging recipient addresses.
6. Staging `CRON_SECRET`, `AUTH_SECRET`, and `CREDENTIALS_ENCRYPTION_KEY`.
7. `APP_ENV=staging` and a non-empty `STAGING_RECIPIENT_ALLOWLIST`.

## Rollback procedures

The remediation remains additive (new enum values, optional fields, and helper
modules). Rolling back is a code revert of the changed files; no destructive
migration is required. If the quota or login-throttle `ApplicationSetting`
documents ever need clearing, delete keys matching `daily_send_counter:*` and
`login_fail_*` (note: this resets quota/throttle accounting).

## Staging guard rollback

The staging guard is additive and inactive unless `APP_ENV=staging`. To
disable it, unset `APP_ENV` or set it to `production`/`development`. The
`staging` branch can be deleted locally with `git branch -D staging` (after
switching away); this does not affect `main`.
