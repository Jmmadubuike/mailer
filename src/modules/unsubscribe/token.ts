import { createHmac, timingSafeEqual } from "node:crypto";

export interface UnsubscribeToken {
  recipientId: string;
  email: string;
}

export function createUnsubscribeToken(
  secret: string,
  recipientId: string,
  email: string,
): string {
  const payload = `${recipientId}:${email}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${signature}`;
}

export function verifyUnsubscribeToken(
  secret: string,
  token: string,
): UnsubscribeToken | null {
  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const encoded = token.slice(0, separator);
  const provided = token.slice(separator + 1);

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payloadSeparator = payload.indexOf(":");
  if (payloadSeparator <= 0) return null;
  const recipientId = payload.slice(0, payloadSeparator);
  const email = payload.slice(payloadSeparator + 1);
  if (!recipientId || !email) return null;

  return { recipientId, email };
}
