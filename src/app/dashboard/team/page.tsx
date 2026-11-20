import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { listUsers } from "@/modules/users/service";
import { TeamManager } from "@/components/team/team-manager";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await requireRole("owner", "administrator");
  await connectDB();

  const users = await listUsers();
  return (
    <TeamManager
      currentUserId={user.sub}
      role={user.role}
      users={users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      }))}
    />
  );
}
