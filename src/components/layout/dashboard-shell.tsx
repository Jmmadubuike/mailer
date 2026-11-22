import type { SessionPayload } from "@/lib/auth/session";
import { ShellNav } from "@/components/layout/shell-nav";
import { isStaging } from "@/lib/staging/guard";

export function DashboardShell({
  user,
  children,
}: {
  user: SessionPayload;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <ShellNav user={user} staging={isStaging()} />
      <main className="px-4 pb-8 pt-20 sm:px-6 lg:ml-64 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
