# User Journey Audit

Each journey was traced through source; runtime execution is noted where safe.

## 1. Login

Status: WORKING (success path). Error path PARTIALLY WORKING (500 instead of
401; generic message). The 15-minute/5-attempt lockout returns 429 correctly.
Dead ends: none.

## 2. Logout

Status: WORKING. Posts to `/api/auth/logout`, clears the cookie, redirects to
`/login`.

## 3. Password recovery

Status: PARTIALLY WORKING. Request always returns success (good
anti-enumeration), but the reset email is only delivered when a verified
sending domain exists; otherwise the URL is logged server-side (FUN-06). The
`/reset?token=...` page and submit handler are implemented.

## 4. Dashboard access

Status: WORKING for all roles. Sidebar shows admin links to roles that can't
use them (FUN-02), causing redirect round-trips.

## 5. Sending domain setup

Status: WORKING (register, attach API key, verify, activate, test, stats). The
strongest journey in the app.

## 6. Contact import

Status: WORKING (upload → map → options/consent → run → report). Not executed
end-to-end to avoid creating data. Clear steps and empty states.

## 7. Contact management

Status: WORKING (create, search, paginate, status change, single/bulk delete,
export). Delete lacks confirmation (SEC-01). Pagination is minimal.

## 8. List and segment management

Status: Lists WORKING (create + add contacts); list edit/delete NOT
IMPLEMENTED. Segments WORKING (condition builder + estimate + delete). Segment
builder rows overflow on mobile (MOB-03).

## 9. Template selection

Status: WORKING. Templates are code-defined; the campaign form can start from a
template (subject + styled HTML). The Templates page is read-only by design.

## 10. Campaign creation and sending

Status: PARTIALLY WORKING. Create/save draft/schedule/send/duplicate/test are
implemented. Blocked without a verified domain (FUN-07). "Send now" lacks a
confirmation step (SEC-01).

## 11. Reporting and analytics

Status: WORKING. Campaign detail shows recipient-level delivery/engagement;
Analytics shows combined and per-domain stats.

## 12. Team management

Status: WORKING (invite, role change, enable/disable, reset password, remove).
Disable/remove lack confirmation (SEC-01).

## 13. Unsubscribe

Status: WORKING. Token verified server-side; one-click confirm; clear
invalid/done states.

## Dead ends & gaps summary

- Campaign creation with no verified domain (FUN-07).
- Password reset without a sending domain (FUN-06).
- Role-inappropriate sidebar links (FUN-02).
- No list edit/delete.
- No campaign list pagination/search.
