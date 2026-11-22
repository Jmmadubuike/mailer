import { requireRole } from "@/lib/auth/authorize";
import { listTemplates } from "@/modules/templates/service";
import { TemplatesManager } from "@/components/templates/templates-manager";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await requireRole("owner", "administrator", "campaign_manager", "viewer");

  const templates = await listTemplates();
  return <TemplatesManager templates={templates} />;
}
