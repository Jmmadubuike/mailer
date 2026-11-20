import "server-only";
import { Resend } from "resend";
import { getEnv } from "@/config/env";
import { SendingDomain, type ISendingDomain } from "@/models/SendingDomain";
import { decryptSecret } from "@/lib/security/crypto";

let managementClient: Resend | null = null;

export function getManagementClient(): Resend {
  const apiKey = getEnv().RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured. Set it to manage Resend domains.",
    );
  }

  managementClient ??= new Resend(apiKey);
  return managementClient;
}

export interface ResolvedDomainClient {
  client: Resend;
  domain: ISendingDomain;
}

export async function getClientForSendingDomain(
  domainId: string,
): Promise<ResolvedDomainClient> {
  const domain = await SendingDomain.findById(domainId)
    .select("+apiKeyEnc +apiKeyIv +apiKeyAuthTag")
    .lean<ISendingDomain>();

  if (!domain) {
    throw new Error("Sending domain not found");
  }

  if (!domain.apiKeyEnc || !domain.apiKeyIv || !domain.apiKeyAuthTag) {
    throw new Error(
      `No API key configured for domain "${domain.domain}". Add a sending API key first.`,
    );
  }

  const apiKey = decryptSecret({
    ciphertext: domain.apiKeyEnc,
    iv: domain.apiKeyIv,
    authTag: domain.apiKeyAuthTag,
  });

  return { client: new Resend(apiKey), domain };
}
