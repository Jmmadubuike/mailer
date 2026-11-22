# Mobile Responsiveness Audit

Tested viewports: 320x568, 360x800, 375x812, 390x844, 414x896, 430x932,
768x1024, 820x1180, 1024x768, 1280x720, 1366x768, 1440x900, 1920x1080.

Verification method: static analysis of Tailwind breakpoint usage across every
page/component, headless-browser screenshots of the public pages, and
server-rendered HTML checks of the authenticated pages. No automated
click-through was available (no E2E tooling in the project).

## Findings

### MOB-01 — Fixed sidebar with no mobile navigation

- Severity: P1 (effectively P0 on phones)
- Pages: all `/dashboard/*`
- Component: `src/components/layout/dashboard-shell.tsx`
- Current behaviour: `<aside className="fixed inset-y-0 left-0 w-64">` plus
  `<main className="ml-64">`. There is no breakpoint, no hamburger, and no
  drawer. Below ~640px the 256px sidebar covers most of the viewport and the
  content is pushed off-screen or trapped under it.
- Expected: a top bar with a menu button on mobile that opens a collapsible
  drawer; `main` takes full width below `lg`.
- Reproduce: open any dashboard route at 375x812.
- Devices: all phones; landscape phones and small tablets are also cramped.
- Files: `dashboard-shell.tsx`, `dashboard/layout.tsx`.
- Recommendation: add a mobile header + stateful drawer (client component),
  `lg:ml-64`, `lg:translate-x-0` pattern.
- Risk: the shell is currently a server component; making it interactive
  requires a small client wrapper — low risk, contained to the shell.

### MOB-02 — Tables rely solely on horizontal scrolling

- Severity: P2
- Pages: analytics, campaigns, campaign detail, contacts, sending domains,
  suppressions, team, audit logs
- Current behaviour: every data table is wrapped in `<div
  className="overflow-x-auto">`. Functionally it does not break, but on phones
  tables become long horizontal scrolls with no visual affordance and tiny
  action targets.
- Expected: keep horizontal scroll only for genuinely wide tables, but provide
  card/stacked alternatives for key lists (contacts, campaigns, team) and a
  visible scroll hint.
- Recommendation: introduce a reusable `ResponsiveTable`/`DataList` that renders
  cards below `sm` and a table above.

### MOB-03 — Segment builder rows overflow

- Severity: P2
- Pages: `/dashboard/segments`
- Component: `segments-manager.tsx` `CreateSegmentDialog`
- Current behaviour: each condition row is
  `flex gap-2` with fixed `w-44` and `w-40` selects/inputs and a `flex-1` value
  input; there is no wrapping, so at 320–430px the row overflows the modal.
- Expected: wrap each condition into a grid that stacks on mobile.
- Files: `segments-manager.tsx`.

### MOB-04 — Sub-44px touch targets

- Severity: P2
- Pages: contacts, sending domains, team, segments, import
- Current behaviour: many table action buttons use `px-2.5 py-1 text-xs`
  (about 24px tall) — below the 44x44px recommended minimum.
- Expected: ≥44px targets, or at least `py-2` with adequate horizontal padding
  on touch-first layouts.
- Files: `contacts-manager.tsx`, `sending-domains-manager.tsx`,
  `team-manager.tsx`, `segments-manager.tsx`, `import-wizard.tsx`.

### MOB-05 — Analytics stat grid becomes seven narrow cards

- Severity: P3
- Pages: `/dashboard/analytics`, `/dashboard/campaigns/[id]`
- Current behaviour: `lg:grid-cols-7` forces seven cards into one row on
  laptops/desktops, making labels and values cramped.
- Expected: `xl:grid-cols-7` with `sm:grid-cols-4` so tablets/desktops wrap
  gracefully.

## What is already good

- Login/reset/unsubscribe pages are fully responsive (centered `max-w-sm/md`
  cards with `px-4`).
- Campaign create form and import wizard use `max-w-3xl` with stacked sections.
- Rich-text editor toolbar uses `flex-wrap`.
- Analytics/suppressions/team tables already have `overflow-x-auto` wrappers,
  which prevents page-level horizontal scrolling.
