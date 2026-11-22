# Cross-Page Design Consistency

## Findings

### CONS-01 — Duplicate toast implementations

- Severity: P2
- Current: every feature re-implements a toast `div` inline (contacts, lists,
  segments, suppressions, team, settings, campaign actions, sending domains).
  Auto-dismiss timing varies (contacts/suppressions 3.5s, sending domains 4s,
  others never auto-dismiss), and none are announced.
- Expected: one shared `Toast`/`Toaster` component.

### CONS-02 — Duplicate stat card components

- Severity: P3
- Current: `Stat`/`StatCard` are redefined in `dashboard/page.tsx`,
  `analytics/page.tsx`, `campaigns/[id]/page.tsx`, and `import-wizard.tsx` with
  different padding/text sizes.
- Expected: one shared `Stat` component.

### CONS-03 — Duplicate dialog implementations

- Severity: P2
- Current: `team-manager.tsx` defines `Dialog`, `inputClass`, `primaryClass`,
  `secondaryClass`; `sending-domains-manager.tsx` defines its own `Dialog`,
  `Field`, `Input`; other managers inline overlay divs. Widths and behaviour
  differ (`max-w-sm`, `max-w-md`, `max-w-lg`, `max-w-2xl`).
- Expected: one shared `Dialog` with size variants.

### CONS-04 — Inconsistent destructive-action styling and labels

- Severity: P2
- Current: destructive actions are sometimes red (`border-red-200 text-red-700`)
  and sometimes slate; labels vary ("Delete", "Remove", "Cancel"). Red is also
  used for the non-destructive "Cancel" campaign action.
- Expected: consistent destructive color and verb conventions.

### CONS-05 — Inconsistent status badge styling

- Severity: P3
- Current: campaign status uses a gray pill for every state; team status uses
  emerald/gray; sending domains use multiple bespoke badge components. No shared
  visual language for status.
- Expected: one `StatusBadge` with semantic variants.

### CONS-06 — Branding inconsistency

- Severity: P3
- Current: sidebar and login say "Mailer", while `layout.tsx` metadata title is
  still "Create Next App".
- Expected: consistent product name and metadata.

## Recommendation

Establish a minimal design-system layer under `src/components/ui/` (Button,
Input, Field, Dialog, Toast, Stat, Badge, Table) and migrate features gradually,
reusing existing styles instead of introducing a new dependency.
