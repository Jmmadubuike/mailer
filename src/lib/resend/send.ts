import "server-only";
import { getClientForSendingDomain } from "@/lib/resend/client";
import { assertStagingSendAllowed } from "@/lib/staging/guard";

export interface SendThroughDomainInput {
  domainId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
}

export interface SendThroughDomainResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export async function sendThroughDomain(
  input: SendThroughDomainInput,
): Promise<SendThroughDomainResult> {
  assertStagingSendAllowed(input.to);

  const { client, domain } = await getClientForSendingDomain(input.domainId);

  const fromName = input.fromName ?? domain.defaultSenderName ?? domain.name;
  const fromEmail =
    input.fromEmail ?? domain.defaultSenderAddress ?? `mail@${domain.domain}`;

  const { data, error } = await client.emails.send({
    from: `${fromName} <${fromEmail}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo ?? domain.defaultReplyTo,
    headers: input.headers,
    idempotencyKey: input.idempotencyKey,
  } as Parameters<typeof client.emails.send>[0] & {
    idempotencyKey?: string;
  });

  if (error) {
    return { ok: false, error: error.message ?? "Resend rejected the email" };
  }

  return { ok: true, messageId: data?.id };
}
