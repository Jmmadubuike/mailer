import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { MailingList } from "@/models/MailingList";
import { ImportWizard } from "@/components/imports/import-wizard";

export const dynamic = "force-dynamic";

export default async function ImportContactsPage() {
  await requireRole("owner", "administrator", "campaign_manager");
  await connectDB();

  const lists = await MailingList.find().sort({ name: 1 }).lean();
  return (
    <ImportWizard
      lists={lists.map((list) => ({
        id: list._id.toString(),
        name: list.name,
      }))}
    />
  );
}
