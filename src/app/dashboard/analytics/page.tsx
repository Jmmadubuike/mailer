import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { getDomainStats } from "@/modules/sending-domains/service";
import { SendingDomain } from "@/models/SendingDomain";
import { Stat } from "@/components/ui/stat";
import { AnalyticsIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  await requireRole(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  await connectDB();

  const [combined, domains] = await Promise.all([
    getDomainStats(),
    SendingDomain.find().sort({ name: 1 }).lean(),
  ]);
  const perDomain = await Promise.all(
    domains.map((domain) => getDomainStats(domain._id.toString())),
  );

  return (
    <div>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <AnalyticsIcon className="h-5 w-5 text-slate-400" />
          Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Delivery and engagement across all sending domains, aggregated from
          recipient records and provider webhooks.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        <Stat label="Sent" value={combined.sent} size="compact" />
        <Stat label="Delivered" value={combined.delivered} size="compact" />
        <Stat label="Bounces" value={combined.bounced} size="compact" />
        <Stat label="Complaints" value={combined.complaints} size="compact" />
        <Stat label="Opens" value={combined.opens} size="compact" />
        <Stat label="Clicks" value={combined.clicks} size="compact" />
        <Stat
          label="Delivery rate"
          value={`${(combined.deliveryRate * 100).toFixed(1)}%`}
          size="compact"
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Sent</th>
                <th className="px-4 py-3 font-medium">Delivered</th>
                <th className="px-4 py-3 font-medium">Bounces</th>
                <th className="px-4 py-3 font-medium">Opens</th>
                <th className="px-4 py-3 font-medium">Clicks</th>
                <th className="px-4 py-3 font-medium">Delivery rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perDomain.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No sending domains registered yet.
                  </td>
                </tr>
              ) : (
                perDomain.map((stats) => (
                  <tr key={stats.domainId}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {stats.domainName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{stats.sent}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {stats.delivered}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {stats.bounced}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{stats.opens}</td>
                    <td className="px-4 py-3 text-slate-600">{stats.clicks}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {(stats.deliveryRate * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

