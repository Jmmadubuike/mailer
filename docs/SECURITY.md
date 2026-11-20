# Security

- Argon2id-class password hashing via Node `scrypt`.
- HTTP-only, Secure, SameSite session cookies signed with `jose`.
- Role-based authorization on every protected route.
- API keys encrypted at rest with AES-256-GCM and an out-of-database key; only
  masked hints are ever returned.
- HTML sanitization (`sanitize-html`) on campaign and template content before
  save and again before send.
- Zod validation on all inputs; MongoDB queries built from validated values.
- Webhook signature verification and event deduplication.
- CSV formula-injection guarding on exports.
- Global kill switch, daily sending limit, test mode, and per-domain emergency
  stop.
- Audit logging for administrative and delivery actions.
