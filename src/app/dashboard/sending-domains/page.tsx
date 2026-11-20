import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { listDomains } from "@/modules/sending-domains/service";
import { SendingDomainsManager } from "@/components/sending-domains/sending-domains-manager";

export const dynamic = "force-dynamic";

export default async function SendingDomainsPage() {
  await requireRole("owner");
  await connectDB();

  const domains = await listDomains();
  return <SendingDomainsManager domains={domains} />;
}
