import { getEnv } from "@/config/env";
import { verifyUnsubscribeToken } from "@/modules/unsubscribe/token";
import { UnsubscribeClient } from "@/components/unsubscribe/unsubscribe-client";

export const dynamic = "force-dynamic";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const verified = token
    ? verifyUnsubscribeToken(getEnv().AUTH_SECRET, token)
    : null;

  return (
    <UnsubscribeClient
      token={token ?? ""}
      email={verified?.email ?? null}
      valid={!!verified}
    />
  );
}
