# Deployment

Deploy to Vercel. Set all variables from `.env.example` in the project
environment, including `CRON_SECRET`. Vercel Cron jobs are declared in
`vercel.json`; Vercel attaches the `CRON_SECRET` as a bearer token
automatically.

Before sending real email: verify the Resend account, verify each sending
domain, confirm SPF/DKIM/DMARC, configure the webhook endpoint to
`/api/webhooks/resend`, and run the sending-domain connectivity tests.
