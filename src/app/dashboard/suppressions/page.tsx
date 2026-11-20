import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { Suppression } from "@/models/Suppression";
import {
  SuppressionsManager,
  type SuppressionDTO,
} from "@/components/suppressions/suppressions-manager";

export const dynamic = "force-dynamic";

export default async function SuppressionsPage() {
  const user = await requireRole(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  await connectDB();

  const suppressions = await Suppression.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const initialSuppressions: SuppressionDTO[] = suppressions.map(
    (suppression) => ({
      id: suppression._id.toString(),
      email: suppression.email,
      type: suppression.type,
      scope: suppression.scope,
      reason: suppression.reason ?? null,
      createdAt: suppression.createdAt.toISOString(),
    }),
  );

  return (
    <SuppressionsManager
      canDelete={user.role === "owner"}
      initialSuppressions={initialSuppressions}
    />
  );
}
