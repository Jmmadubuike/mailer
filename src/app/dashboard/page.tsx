import Link from "next/link";
import dynamicImport from "next/dynamic";
import { connectDB } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorize";
import { SendingDomain } from "@/models/SendingDomain";
import { Campaign } from "@/models/Campaign";
import { AuditLog } from "@/models/AuditLog";
import { getEngagementSeries } from "@/modules/analytics/service";
import { Stat } from "@/components/ui/stat";
import { RelativeTime } from "@/components/dashboard/relative-time";
import { actionLabel, humanizeToken } from "@/lib/labels";
import {
  AnalyticsIcon,
  AuditLogsIcon,
  CampaignsIcon,
  CheckCircleIcon,
  SendingDomainsIcon,
} from "@/components/ui/icons";

const EngagementChart = dynamicImport(
  () =>
    import("@/components/dashboard/engagement-chart").then(
      (mod) => mod.EngagementChart,
    ),
  {
    loading: () => (
      <div className="h-72 w-full animate-pulse rounded bg-slate-100" />
    ),
  },
);

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  await connectDB();

  const [
    domainCount,
    activeDomainCount,
    campaignCount,
    recentCampaigns,
    recentActivity,
    engagement,
  ] = await Promise.all([
    SendingDomain.countDocuments(),
    SendingDomain.countDocuments({ isActive: true }),
    Campaign.countDocuments(),
    Campaign.find().sort({ createdAt: -1 }).limit(5).lean(),
    AuditLog.find().sort({ createdAt: -1 }).limit(6).lean(),
    getEngagementSeries(14),
  ]);

  const hasEngagement = engagement.some(
    (point) => point.sent > 0 || point.opened > 0 || point.clicked > 0,
  );

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome back, {user.name}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Here&apos;s a quick overview of your email campaigns and senders.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Email senders"
          value={String(domainCount)}
          hint="Domains you can send from"
          icon={SendingDomainsIcon}
        />
        <Stat
          label="Active senders"
          value={String(activeDomainCount)}
          hint="Turned on and ready"
          icon={CheckCircleIcon}
        />
        <Stat
          label="Email campaigns"
          value={String(campaignCount)}
          hint="Created in this account"
          icon={CampaignsIcon}
        />
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <SendingDomainsIcon className="h-5 w-5 text-slate-400" />
          Set up who your emails come from
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Add and verify the domain you want to send from, then choose it
          whenever you create a campaign. We&apos;ll show you the exact DNS
          records to add and check them for you.
        </p>
        <Link
          href="/dashboard/sending-domains"
          className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Manage senders
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white">
          <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <CampaignsIcon className="h-5 w-5 text-slate-400" />
              Recent campaigns
            </h2>
            <Link
              href="/dashboard/campaigns"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              View all
            </Link>
          </header>
          {recentCampaigns.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">
              You haven&apos;t created any campaigns yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentCampaigns.map((campaign) => (
                <div
                  key={campaign._id.toString()}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {campaign.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {campaign.recipientCount} recipients
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-slate-600">
                    {humanizeToken(campaign.status)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <header className="border-b border-slate-100 px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <AuditLogsIcon className="h-5 w-5 text-slate-400" />
              Recent activity
            </h2>
          </header>
          {recentActivity.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">No activity yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((log) => (
                <div key={log._id.toString()} className="px-5 py-3">
                  <p className="text-sm text-slate-700">
                    {actionLabel(log.action)}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-slate-500">
                      By {log.actorEmail}
                    </p>
                    <span className="shrink-0 text-xs text-slate-400">
                      <RelativeTime date={log.createdAt.toISOString()} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white">
        <header className="border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <AnalyticsIcon className="h-5 w-5 text-slate-400" />
            Email engagement
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            How many emails were sent, opened, and clicked over the last 14
            days.
          </p>
        </header>
        <div className="p-5">
          {hasEngagement ? (
            <EngagementChart data={engagement} />
          ) : (
            <div className="flex h-72 items-center justify-center rounded bg-slate-50 text-sm text-slate-500">
              No email activity in the last 14 days yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
