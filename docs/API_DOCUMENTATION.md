# API documentation

All routes are server-side and enforce session authentication plus role checks.
Owner-only writes are noted.

- `/api/auth` — `login`, `logout`, `me`, `forgot`, `reset`.
- `/api/users` — team CRUD and password reset (Owner/Administrator).
- `/api/contacts` — list/search, create, update, delete, export, bulk delete.
- `/api/lists` — list CRUD and `/api/lists/:id/add-contacts`.
- `/api/segments` — segment CRUD and audience estimate.
- `/api/templates` — template CRUD and `/api/templates/seed`.
- `/api/campaigns` — create/list; `/:id` reschedule; `/:id/cancel`,
  `/:id/test`, `/:id/report`, `/:id/recipients`, `/:id/export`.
- `/api/sending-domains` — domain CRUD plus `/:id/verify`, `/:id/test`,
  `/:id/activate`, `/:id/deactivate`, `/:id/emergency-stop`, `/:id/stats`,
  `/options`, `/stats` (combined).
- `/api/settings` — platform safety settings (Owner write).
- `/api/suppressions` — list and `/:id` delete (Owner).
- `/api/audit-logs` — audit trail (Owner/Administrator).
- `/api/unsubscribe` and `/api/unsubscribe/one-click` — public opt-out.
- `/api/webhooks/resend` — provider webhook ingestion.
- `/api/internal/scheduler/run` and `/api/internal/worker/run` — cron-only.
