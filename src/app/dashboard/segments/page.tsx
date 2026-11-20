import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { listSegments } from "@/modules/segments/service";
import { SegmentsManager } from "@/components/segments/segments-manager";

export const dynamic = "force-dynamic";

export default async function SegmentsPage() {
  await requireRole(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  await connectDB();

  const segments = await listSegments();
  return (
    <SegmentsManager
      segments={segments.map((segment) => ({
        id: segment._id.toString(),
        name: segment.name,
        description: segment.description ?? null,
        root: segment.root,
      }))}
    />
  );
}
