import Link from "next/link";
import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { listCampaigns } from "@/modules/campaigns/service";
import { SendingDomain } from "@/models/SendingDomain";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  await requireRole(
    "owner",
    "administrator",
    "campaign_manager",
    "viewer",
  );
  await connectDB();

  const [campaigns, domains] = await Promise.all([
    listCampaigns(),
    SendingDomain.find().select("name domain").lean(),
  ]);
  const domainNames = new Map(
    domains.map((domain) => [domain._id.toString(), domain.name]),
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
          <p className="mt-1 text-sm text-slate-500">
            Every campaign is bound to a single sending domain.
          </p>
        </div>
        <Link
          href="/dashboard/campaigns/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New campaign
        </Link>
      </div>

      <div className="mt-6 space-y-3 md:hidden">
        {campaigns.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No campaigns yet.
          </div>
        ) : (
          campaigns.map((campaign) => (
            <Link
              key={campaign._id.toString()}
              href={`/dashboard/campaigns/${campaign._id.toString()}`}
              className="block rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-medium text-slate-900">
                  {campaign.name}
                </p>
                <Badge tone={statusTone(campaign.status)}>
                  {campaign.status}
                </Badge>
              </div>
              <p className="mt-1 truncate text-sm text-slate-600">
                {campaign.subject}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {domainNames.get(campaign.sendingDomainId.toString()) ?? "—"} ·{" "}
                {campaign.recipientCount} recipients ·{" "}
                {campaign.createdAt.toISOString().slice(0, 10)}
              </p>
            </Link>
          ))
        )}
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Recipients</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No campaigns yet.
                  </td>
                </tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign._id.toString()}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/campaigns/${campaign._id.toString()}`}
                        className="font-medium text-slate-900 hover:text-indigo-600 hover:underline"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {campaign.subject}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {domainNames.get(campaign.sendingDomainId.toString()) ??
                        "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {campaign.recipientCount}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {campaign.createdAt.toISOString().slice(0, 10)}
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

function statusTone(status: string): "neutral" | "success" | "danger" | "warning" {
  if (status === "sent") return "success";
  if (status === "failed") return "danger";
  if (["preparing", "scheduled", "queued", "sending", "partially_failed"].includes(status)) {
    return "warning";
  }
  return "neutral";
}
