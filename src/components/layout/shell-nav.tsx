"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionPayload } from "@/lib/auth/session";
import { LogoutButton } from "@/components/layout/logout-button";
import { cn } from "@/lib/utils";
import {
  AnalyticsIcon,
  AuditLogsIcon,
  CampaignsIcon,
  ContactsIcon,
  CreateCampaignIcon,
  ImportIcon,
  ListsIcon,
  OverviewIcon,
  SegmentsIcon,
  SendingDomainsIcon,
  SettingsIcon,
  SuppressionsIcon,
  TeamIcon,
  TemplatesIcon,
  type IconComponent,
} from "@/components/ui/icons";

const ALL_ROLES = ["owner", "administrator", "campaign_manager", "viewer"] as const;
const MANAGER_ROLES = ["owner", "administrator", "campaign_manager"] as const;
const ADMIN_ROLES = ["owner", "administrator"] as const;

interface NavItem {
  href: string;
  label: string;
  icon: IconComponent;
  roles: readonly string[];
}

interface NavSection {
  title: string | null;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: null,
    items: [
      { href: "/dashboard", label: "Overview", icon: OverviewIcon, roles: ALL_ROLES },
    ],
  },
  {
    title: "Audience",
    items: [
      { href: "/dashboard/lists", label: "Mailing Lists", icon: ListsIcon, roles: ALL_ROLES },
      { href: "/dashboard/contacts", label: "Contacts", icon: ContactsIcon, roles: ALL_ROLES },
      {
        href: "/dashboard/contacts/import",
        label: "Import Contacts",
        icon: ImportIcon,
        roles: MANAGER_ROLES,
      },
      { href: "/dashboard/segments", label: "Segments", icon: SegmentsIcon, roles: ALL_ROLES },
      {
        href: "/dashboard/suppressions",
        label: "Suppressions",
        icon: SuppressionsIcon,
        roles: ALL_ROLES,
      },
    ],
  },
  {
    title: "Campaigns",
    items: [
      { href: "/dashboard/campaigns", label: "All Campaigns", icon: CampaignsIcon, roles: ALL_ROLES },
      {
        href: "/dashboard/campaigns/new",
        label: "Create Campaign",
        icon: CreateCampaignIcon,
        roles: MANAGER_ROLES,
      },
      { href: "/dashboard/templates", label: "Templates", icon: TemplatesIcon, roles: ALL_ROLES },
    ],
  },
  {
    title: "Reports",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: AnalyticsIcon, roles: ALL_ROLES },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        href: "/dashboard/sending-domains",
        label: "Sending Domains",
        icon: SendingDomainsIcon,
        roles: ["owner"],
      },
      { href: "/dashboard/settings", label: "Settings", icon: SettingsIcon, roles: ALL_ROLES },
      { href: "/dashboard/team", label: "Team Members", icon: TeamIcon, roles: ADMIN_ROLES },
      {
        href: "/dashboard/audit-logs",
        label: "Audit Logs",
        icon: AuditLogsIcon,
        roles: ADMIN_ROLES,
      },
    ],
  },
];

export function ShellNav({
  user,
  staging = false,
}: {
  user: SessionPayload;
  staging?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function isActive(href: string): boolean {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 lg:hidden">
        <span className="flex items-center gap-2 text-base font-semibold text-white">
          <SendingDomainsIcon className="h-5 w-5" />
          Mailer
          {staging && (
            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
              Staging
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-md text-slate-100 hover:bg-slate-800"
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-100 transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6">
          <span className="flex items-center gap-2 text-lg font-semibold">
            <SendingDomainsIcon className="h-5 w-5 text-slate-100" />
            Mailer
            {staging && (
              <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                Staging
              </span>
            )}
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-slate-800 lg:hidden"
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {SECTIONS.map((section) => (
            <div key={section.title ?? "overview"}>
              {section.title && (
                <p className="px-3 pb-1 pt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </p>
              )}
              {section.items
                .filter((item) => item.roles.includes(user.role))
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium",
                      isActive(item.href)
                        ? "bg-slate-800 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white",
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-slate-300">{user.email}</p>
          <div className="mt-3">
            <LogoutButton />
          </div>
        </div>
      </aside>
    </>
  );
}
