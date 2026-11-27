# Email deliverability

Mailer routes every campaign through a verified Resend sending domain. Inbox
placement depends on several factors outside the application, but the platform
enforces the technical prerequisites that have the largest impact:

## Authentication (SPF, DKIM, DMARC)

For each sending domain:

1. Register the domain under **Administration -> Sending Domains**.
2. Add the returned SPF/DKIM DNS records at your DNS provider.
3. Click **Verify** and wait for the domain to become `verified`.
4. Publish a DMARC TXT record so mailbox providers can see your policy:

   - Name: `_dmarc.<your-domain>`
   - Value: `v=DMARC1; p=none;`

   Start with `p=none` while you monitor, then move to `p=quarantine` once
   authentication is stable. The domain card shows whether DMARC was detected.

## Sender alignment

A campaign's From address must use the selected sending domain. The send path
rejects mismatched From addresses, which prevents the common deliverability
failure of sending "from" a domain that does not match the authenticated
domain.

## Bulk-mail signals

Campaign sends automatically include:

- `List-Unsubscribe` and `List-Unsubscribe-Post` headers (one-click opt-out).
- `Precedence: bulk`.
- `List-Id` scoped to the sending domain.
- A plain-text alternative generated from the HTML body.

## List hygiene

- Unsubscribes, bounces, and complaints are stored in the suppression list and
  excluded from future sends.
- The queue re-checks suppression status immediately before each submission.
- Bounce and complaint suppressions cannot be removed from the dashboard.

## Sending practices

- Send only to recipients who opted in.
- Warm up a new domain with small batches before large broadcasts.
- Avoid link shorteners, excessive capitalization, and misleading subjects.
- Keep a stable From name/address per domain.
- Monitor bounce, complaint, and spam-rate metrics in the domain Stats view.

No provider can guarantee inbox placement for every message. These controls
remove the most common technical reasons a message is classified as spam.
