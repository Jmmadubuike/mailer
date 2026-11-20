import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { getSendableOptions } from "@/modules/sending-domains/service";
import { MailingList } from "@/models/MailingList";
import { Segment } from "@/models/Segment";
import { CampaignCreateForm } from "@/components/campaigns/campaign-create-form";
import { listTemplates } from "@/modules/templates/service";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  await requireRole("owner", "administrator", "campaign_manager");
  await connectDB();

  const [domains, lists, segments, templates] = await Promise.all([
    getSendableOptions(),
    MailingList.find().sort({ name: 1 }).lean(),
    Segment.find().sort({ name: 1 }).lean(),
    listTemplates(),
  ]);

  return (
    <CampaignCreateForm
      domains={domains}
      lists={lists.map((list) => ({
        id: list._id.toString(),
        name: list.name,
      }))}
      segments={segments.map((segment) => ({
        id: segment._id.toString(),
        name: segment.name,
      }))}
      templates={templates.map((template) => ({
        id: template._id.toString(),
        name: template.name,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent ?? null,
        colors: template.colors ?? null,
      }))}
    />
  );
}
