import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { listTemplates } from "@/modules/templates/service";
import { TemplatesManager } from "@/components/templates/templates-manager";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await requireRole(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  await connectDB();

  const templates = await listTemplates();
  return (
    <TemplatesManager
      canEdit={user.role !== "viewer"}
      isOwner={user.role === "owner"}
      templates={templates.map((template) => ({
        id: template._id.toString(),
        name: template.name,
        description: template.description ?? null,
        category: template.category ?? null,
        subject: template.subject,
        previewText: template.previewText ?? null,
        htmlContent: template.htmlContent,
        textContent: template.textContent ?? null,
        colors: template.colors ?? null,
      }))}
    />
  );
}
