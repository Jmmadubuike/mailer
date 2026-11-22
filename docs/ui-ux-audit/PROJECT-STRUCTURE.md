# Project Structure

## Stack

- Framework: Next.js 16.4.6 (App Router, `src/` directory), React 19.3, Turbopack
- Styling: Tailwind CSS 4.3.3 (`@import "tailwindcss"` + `@tailwindcss/turbopack`)
- Language: TypeScript (strict), path alias `@/* -> ./src/*`
- Database: MongoDB via Mongoose 9 (connection caching in `src/lib/db/client.ts`)
- Email: Resend SDK; per-domain encrypted API keys (`src/lib/resend/*`)
- Auth: JWT session in `mailer_session` httpOnly cookie (jose), scrypt password hashing
- Editor: TipTap (StarterKit + image, link, text-align, color, highlight, underline)
- Charts: Recharts
- Import: PapaParse (CSV) + ExcelJS (XLSX)
- Validation: zod
- Tests: Vitest (4 files, 21 tests)

## Key directories

- `src/app/` — page routes and route handlers (API)
- `src/components/` — client + server UI components, one folder per feature
- `src/lib/` — auth, db, errors, resend, security, templates/colors, utils, csv
- `src/modules/` — business services (campaigns, segments, sending-domains,
  settings, templates, unsubscribe, users, webhooks, analytics, audience, imports)
- `src/models/` — Mongoose models
- `src/types/` — shared TypeScript types
- `scripts/` — `seed-owner.mjs`
- `docs/` — architecture docs and this audit

## Architecture notes

- Authentication is enforced per layout/page via `getSession()` (dashboard
  layout) and `requireRole()` (pages). There is no `middleware.ts`.
- Roles: `owner`, `administrator`, `campaign_manager`, `viewer`.
- Server components fetch data directly; client components use `fetch` to the
  JSON API routes and `router.refresh()` after mutations.
- All dashboard pages and API routes are `force-dynamic`.

## Styling conventions

- Tailwind utility classes inline; no component library.
- Recurring ad-hoc patterns: `card-hover`, `rounded-lg border border-slate-200
  bg-white`, primary buttons `bg-slate-900 text-white`, destructive buttons
  `border-red-200 text-red-700`.
- Global base styles in `src/app/globals.css` (font vars, focus/transition on
  form controls, fade-in animation, `card-hover`).

## Test tooling

- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint (Next config)
- `npm run test` — `vitest run` (unit tests for csv, personalization, segments,
  unsubscribe tokens)
- No browser/E2E automation is present in the project.
