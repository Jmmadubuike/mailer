import Link from "next/link";
import type { SessionPayload } from "@/lib/auth/session";
import { LogoutButton } from "@/components/layout/logout-button";

export function DashboardShell({
  user,
  children,
}: {
  user: SessionPayload;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-slate-900 text-slate-100">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <span className="text-lg font-semibold">Mailer</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <Link
            href="/dashboard"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Overview
          </Link>

          <p className="px-3 pb-1 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Audience
          </p>
          <Link
            href="/dashboard/lists"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Mailing Lists
          </Link>
          <Link
            href="/dashboard/contacts"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Contacts
          </Link>
          <Link
            href="/dashboard/contacts/import"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Import Contacts
          </Link>
          <Link
            href="/dashboard/segments"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Segments
          </Link>
          <Link
            href="/dashboard/suppressions"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Suppressions
          </Link>

          <p className="px-3 pb-1 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Campaigns
          </p>
          <Link
            href="/dashboard/campaigns"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            All Campaigns
          </Link>
          <Link
            href="/dashboard/campaigns/new"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Create Campaign
          </Link>
          <Link
            href="/dashboard/templates"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Templates
          </Link>

          <p className="px-3 pb-1 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Reports
          </p>
          <Link
            href="/dashboard/analytics"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Analytics
          </Link>

          <p className="px-3 pb-1 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Administration
          </p>
          <Link
            href="/dashboard/sending-domains"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Sending Domains
          </Link>
          <Link
            href="/dashboard/settings"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Settings
          </Link>
          <Link
            href="/dashboard/team"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Team Members
          </Link>
          <Link
            href="/dashboard/audit-logs"
            className="block rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Audit Logs
          </Link>

          <p className="px-3 pb-1 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Coming in later phases
          </p>
          <p className="px-3 text-xs leading-5 text-slate-600">
            The rich-text editor.
          </p>
        </nav>

        <div className="border-t border-slate-800 p-4">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-slate-400">{user.email}</p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
