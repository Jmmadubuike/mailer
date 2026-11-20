import Link from "next/link";
import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { getCampaignReport, listCampaignRecipients } from "@/modules/campaigns/report";
import { SendingDomain } from "@/models/SendingDomain";
import { CampaignActions } from "@/components/campaigns/campaign-actions";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  await connectDB();

  const { id } = await params;
  const { campaign, stats } = await getCampaignReport(id);
  const [recipients, domain] = await Promise.all([
    listCampaignRecipients(id),
    SendingDomain.findById(campaign.sendingDomainId).lean(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/campaigns"
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            ← All campaigns
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {campaign.name}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {campaign.subject}
            {domain ? ` · sent via ${domain.name}` : ""}
          </p>
        </div>
        <CampaignActions
          campaignId={id}
          status={campaign.status}
          canManage={user.role !== "viewer"}
          canDelete={user.role === "owner" || user.role === "administrator"}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Recipients" value={stats.total} />
        <Stat label="Sent" value={stats.sent} />
        <Stat label="Delivered" value={stats.delivered} />
        <Stat label="Bounced" value={stats.bounced} />
        <Stat label="Opens" value={stats.opens} />
        <Stat label="Clicks" value={stats.clicks} />
        <Stat label="Delivery rate" value={`${(stats.deliveryRate * 100).toFixed(1)}%`} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Recipients</h2>
        <a
          href={`/api/campaigns/${id}/export`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Message ID</th>
                <th className="px-4 py-3 font-medium">Events</th>
                <th className="px-4 py-3 font-medium">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No recipients yet.
                  </td>
                </tr>
              ) : (
                recipients.map((recipient) => (
                  <tr key={recipient._id.toString()}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {recipient.email}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {recipient.status}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {recipient.providerMessageId ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {recipient.events.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {recipient.error ?? "—"}
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

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-hover rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
