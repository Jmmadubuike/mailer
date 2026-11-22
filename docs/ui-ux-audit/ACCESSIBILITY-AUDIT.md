# Accessibility Audit (WCAG 2.2 AA)

Assessment is source-based; real screen-reader and keyboard traversal was not
automated (no E2E tooling in the project).

## Findings

### A11Y-01 — Form fields without accessible labels

- Severity: P1
- Current: many inputs rely on `placeholder` only (contact dialog, list form,
  team invite, reset email, segment builder rows) or on a sibling `<label>`
  without `htmlFor` (campaign `Field`, sending-domains `Field`). Screen readers
  cannot reliably name these controls.
- Expected: every input/select/textarea associated with a `<label htmlFor>` or
  an explicit `aria-label`.
- Files: `contacts-manager.tsx`, `lists-manager.tsx`, `team-manager.tsx`,
  `reset-form.tsx`, `segments-manager.tsx`, `campaign-create-form.tsx`,
  `sending-domains-manager.tsx`, `settings-manager.tsx`, `import-wizard.tsx`.

### A11Y-02 — Modal dialogs lack focus management

- Severity: P1
- Current: all dialogs (contact create, list add-contacts, segment create,
  domain add/edit/test/stats, team invite/password, campaign test) are
  `fixed inset-0` overlays with no `role="dialog"`/`aria-modal`, no initial
  focus, no focus trap, no Escape-to-close, and background content remains
  focusable.
- Expected: shared dialog with focus trap, Escape handling, `aria-labelledby`,
  `aria-modal`, and return focus to the trigger on close.
- Files: all `*-manager.tsx` dialog implementations.

### A11Y-03 — Toasts are not announced

- Severity: P2
- Current: success/error toasts are `div`s without `role="status"` or
  `aria-live`, so screen-reader users receive no feedback.
- Expected: a shared toast with `role="status"` (or `alert` for errors).

### A11Y-04 — No visible focus indicators on buttons/links

- Severity: P2
- Current: global styles add transitions but no `:focus-visible` ring; inputs
  show `focus:border-indigo-500` but buttons/links do not get a visible focus
  ring.
- Expected: consistent `focus-visible:ring` on all interactive elements.
- Files: `globals.css` + component class strings.

### A11Y-05 — Low-contrast sidebar text

- Severity: P2
- Current: `text-slate-400` (user email, "Sign out") and `text-slate-600`
  ("Coming in later phases") on `bg-slate-900` do not meet AA contrast for
  normal text.
- Expected: lighten to `text-slate-300` or higher.
- Files: `dashboard-shell.tsx`.

### A11Y-06 — Touch targets below 44px

- Severity: P2
- Current: table action buttons use `px-2.5 py-1 text-xs` (~24px tall).
- Expected: ≥44x44px targets on touch layouts.
- Files: `contacts-manager.tsx`, `sending-domains-manager.tsx`,
  `team-manager.tsx`, `segments-manager.tsx`.

## What is already good

- `<html lang="en">` set.
- Password toggle has `aria-label`; settings toggle uses `role="switch"` +
  `aria-checked`.
- Heading hierarchy is mostly correct (`h1` page title, `h2` section/modal).
- SVG icons are `aria-hidden`.
- The email preview `iframe` is sandboxed.
- Login inputs use real labels with `htmlFor`.

## Recommended corrections (summary)

1. Shared labeled `Field`/`Input` primitives.
2. Shared accessible dialog.
3. Shared live-region toast.
4. Global focus-visible styling.
5. Larger touch targets.
6. Error association (`aria-invalid` + `aria-describedby`) on forms.
