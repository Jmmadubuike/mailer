import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { getSettings } from "@/modules/settings/service";
import { SettingsManager } from "@/components/settings/settings-manager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireRole(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  await connectDB();

  const settings = await getSettings();
  return (
    <SettingsManager
      settings={settings}
      canEdit={user.role === "owner"}
    />
  );
}
