# Performance & UI Stability Audit

Measurement note: Lighthouse/Core Web Vitals were not run (no production build
or deployed instance). Observations are from source analysis and dev-server
behaviour.

## Findings

### PERF-01 — No route loading states or Suspense

- Severity: P2
- Current: every page is `force-dynamic` and performs synchronous database
  queries before returning HTML; there are no `loading.tsx` or Suspense
  boundaries, so a slow query blocks the entire first paint with no skeleton.
- Expected: route-level `loading.tsx` and/or Suspense around data sections.

### PERF-02 — Recharts shipped to clients

- Severity: P3
- Current: `EngagementChart` imports the full Recharts set; only used on
  Overview. Client bundle includes charting library.
- Expected: dynamic import/lazy-load the chart, or evaluate a lighter chart.

### PERF-03 — Analytics aggregates full collections per render

- Severity: P3
- Current: `getDomainStats()` runs `$facet` aggregations across all
  `CampaignRecipient` documents on each analytics/sending-domains render; no
  caching.
- Expected: cache results or add precomputed counters; monitor index usage at
  scale.

### PERF-04 — No custom error/not-found pages

- Severity: P3
- Current: there is no `error.tsx` or `not-found.tsx`; unhandled errors fall
  back to the framework default (dev overlay / plain 500).
- Expected: branded, friendly error and 404 pages.

### PERF-05 — Partial dark-mode inconsistency

- Severity: P3
- Current: `globals.css` sets `--background` to `#0b1120` under
  `prefers-color-scheme: dark`, so the page backdrop goes dark, but every card
  is hardcoded `bg-white` with slate text. The result is a mismatched half-dark
  appearance.
- Expected: either remove the dark scheme override or implement a coherent dark
  theme.

## Stability observations

- Dev server is stable across all audited routes (14 authenticated pages at 200).
- TipTap logs an SSR notice and sets `immediatelyRender` to `false` during SSR to
  avoid hydration mismatch — informational, not an error.
- No broken assets or favicon issues observed.
- CSS entry animation (`main > * { animation: fade-in }`) is lightweight.

## Recommendations

- Add `loading.tsx` per data page.
- Lazy-load the engagement chart and the rich-text editor.
- Add `error.tsx`/`not-found.tsx`.
- Reconcile the dark-mode CSS with the component palette.
