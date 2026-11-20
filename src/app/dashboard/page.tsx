import Link from "next/link";
import { connectDB } from "@/lib/db/client";
import { requireUser } from "@/lib/auth/authorize";
import { SendingDomain } from "@/models/SendingDomain";
import { Campaign } from "@/models/Campaign";
import { AuditLog } from "@/models/AuditLog";
import { getEngagementSeries } from "@/modules/analytics/service";
import { EngagementChart } from "@/components/dashboard/engagement-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  await connectDB();

  const [domainCount, activeDomainCount, campaignCount, recentCampaigns, recentActivity, engagement] = await Promise.all([
    SendingDomain.countDocuments(),
    SendingDomain.countDocuments({ isActive: true }),
    Campaign.countDocuments(),
    Campaign.find().sort({ createdAt: -1 }).limit(5).lean(),
    AuditLog.find().sort({ createdAt: -1 }).limit(6).lean(),
    getEngagementSeries(14),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">
        Welcome back, {user.name}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Here is a quick look at your sending infrastructure.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Sending domains" value={String(domainCount)} />
        <StatCard label="Active domains" value={String(activeDomainCount)} />
        <StatCard label="Campaigns" value={String(campaignCount)} />
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Configure your sending domains
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Register and verify Resend domains, attach a dedicated API key to
          each one, and route campaigns through a specific verified domain.
        </p>
        <Link
          href="/dashboard/sending-domains"
          className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Open Sending Domains
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Recent campaigns
            </h2>
          </div>
          {recentCampaigns.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">No campaigns yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentCampaigns.map((campaign) => (
                <div key={campaign._id.toString()} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {campaign.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {campaign.recipientCount} recipients
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {campaign.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">
              Recent activity
            </h2>
          </div>
          {recentActivity.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-500">No activity yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentActivity.map((log) => (
                <div key={log._id.toString()} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm text-slate-700">{log.action}</p>
                    <p className="text-xs text-slate-500">{log.actorEmail}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {log.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Engagement (last 14 days)
          </h2>
        </div>
        <div className="p-5">
          <EngagementChart data={engagement} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
