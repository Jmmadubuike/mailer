# API and Database Mapping

## Route handlers (45 files)

| Area | Endpoints |
| --- | --- |
| Auth | POST /api/auth/login, /logout, /forgot, /reset; GET /api/auth/me |
| Campaigns | GET/POST /api/campaigns; PATCH/DELETE /api/campaigns/:id; POST /:id/send, /:id/test, /:id/cancel, /:id/duplicate; GET /:id/export, /:id/recipients, /:id/report |
| Contacts | GET/POST /api/contacts; PATCH/DELETE /api/contacts/:id; POST /bulk-delete; GET /export |
| Lists | GET/POST /api/lists; POST /api/lists/:id/add-contacts |
| Segments | GET/POST /api/segments; DELETE /api/segments/:id |
| Sending domains | GET/POST /api/sending-domains; GET/PATCH /:id; POST /:id/verify, /:id/test, /:id/activate, /:id/deactivate, /:id/emergency-stop; GET /:id/stats, /stats, /options |
| Settings | GET/PATCH /api/settings |
| Suppressions | GET /api/suppressions; DELETE /api/suppressions/:id |
| Templates | GET /api/templates; GET /api/templates/:id |
| Users | GET/POST /api/users; PATCH/DELETE /api/users/:id; POST /api/users/:id/password |
| Imports | POST /api/imports/run |
| Internal | POST /api/internal/scheduler/run, /api/internal/worker/run |
| Unsubscribe | POST /api/unsubscribe, /api/unsubscribe/one-click |
| Webhooks | POST /api/webhooks/resend |
| Audit | GET /api/audit-logs |

## Models and relationships

- `User` (unique lowercase email; role enum owner/administrator/campaign_manager/
  viewer; scrypt passwordHash `select:false`).
- `Contact` (unique lowercase email; status subscribed/unsubscribed/suppressed;
  tags; customFields).
- `MailingList` and `ListMembership` (unique `(contactId,listId)`).
- `Segment` (Mixed condition tree).
- `SendingDomain` (unique lowercase domain; providerDomainId; AES-GCM encrypted
  API key fields `select:false`; verificationStatus; isActive; emergencyKillSwitch;
  credentialStatus; default sender identity; DNS records).
- `Campaign` (sendingDomainId indexed; status; selectedLists; selectedSegments;
  recipientCount; scheduledAt).
- `CampaignRecipient` (unique `(campaignId,email)`; sendingDomainId; provider
  MessageId sparse index; status; events array; personalization; openedAt/
  clickedAt).
- `DeliveryJob` (unique idempotencyKey; status; attempts; maxAttempts;
  leaseUntil; nextRetryAt; workerRunId; indexes on `(status,nextRetryAt)` and
  `(status,sendingDomainId)`).
- `Suppression` (email; type unsubscribe/complaint/bounce; scope all/list;
  unique `(email,scope,listId)`).
- `WebhookEvent` (unique eventId; processedAt).
- `AuditLog` (action, targetType, meta; createdAt index).
- `ApplicationSetting` (unique key; Mixed value).

## Consistency notes

- Every route enforces authorization on the backend before touching data.
- `CampaignRecipient` is an immutable audience snapshot; later contact changes
  do not affect already-dispatched campaigns (correct by design).
- A contact's `status` and `Suppression` rows are maintained in parallel but can
  diverge (F-10).
