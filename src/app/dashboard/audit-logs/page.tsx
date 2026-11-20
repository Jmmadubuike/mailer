import { connectDB } from "@/lib/db/client";
import { requireRole } from "@/lib/auth/authorize";
import { AuditLog } from "@/models/AuditLog";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage() {
  await requireRole("owner", "administrator");
  await connectDB();

  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Recent administrative activity across the platform.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No audit entries yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id.toString()}>
                    <td className="px-4 py-3 text-slate-600">
                      {log.createdAt.toISOString().slice(0, 19).replace("T", " ")}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {log.actorEmail}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.action}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.targetType
                        ? `${log.targetType}${log.targetId ? `:${log.targetId.slice(0, 8)}` : ""}`
                        : "—"}
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
