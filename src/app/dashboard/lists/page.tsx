import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { MailingList } from "@/models/MailingList";
import { ListsManager } from "@/components/lists/lists-manager";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  await requireRole(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  await connectDB();

  const lists = await MailingList.find().sort({ name: 1 }).lean();
  return (
    <ListsManager
      lists={lists.map((list) => ({
        id: list._id.toString(),
        name: list.name,
        description: list.description ?? null,
      }))}
    />
  );
}
