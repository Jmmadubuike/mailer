"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface SuppressionDTO {
  id: string;
  email: string;
  type: string;
  scope: string;
  reason: string | null;
  createdAt: string;
}

export function SuppressionsManager({
  canDelete,
  initialSuppressions,
}: {
  canDelete: boolean;
  initialSuppressions: SuppressionDTO[];
}) {
  const router = useRouter();
  const [suppressions, setSuppressions] =
    useState<SuppressionDTO[]>(initialSuppressions);
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    const response = await fetch("/api/suppressions");
    const body = await response.json();
    setSuppressions(body.suppressions);
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function remove(id: string) {
    await fetch(`/api/suppressions/${id}`, { method: "DELETE" });
    router.refresh();
    load();
    setToast("Suppression removed");
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Suppressions</h1>
        <p className="mt-1 text-sm text-slate-500">
          Opt-outs, complaints, and bounce suppressions. These addresses are
          excluded from campaign audiences.
        </p>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Reason</th>
                <th className="px-4 py-3 font-medium">Date</th>
                {canDelete && (
                  <th className="px-4 py-3 font-medium">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppressions.length === 0 ? (
                <tr>
                  <td
                    colSpan={canDelete ? 6 : 5}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No suppressions yet.
                  </td>
                </tr>
              ) : (
                suppressions.map((suppression) => (
                  <tr key={suppression.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {suppression.email}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {suppression.type}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {suppression.scope}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {suppression.reason ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {suppression.createdAt.slice(0, 10)}
                    </td>
                    {canDelete && (
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => remove(suppression.id)}
                          className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
