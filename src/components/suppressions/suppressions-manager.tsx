"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import { SuppressionsIcon } from "@/components/ui/icons";

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
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const response = await fetch("/api/suppressions");
    const body = await response.json();
    setSuppressions(body.suppressions);
  }

  function remove(id: string) {
    setConfirmId(id);
  }

  async function confirmedRemove() {
    if (!confirmId) return;
    setBusy(true);
    const response = await fetch(`/api/suppressions/${confirmId}`, {
      method: "DELETE",
    });
    setBusy(false);
    setConfirmId(null);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setToast(body?.error ?? "Remove failed");
      return;
    }
    router.refresh();
    load();
    setToast("Suppression removed");
  }

  return (
    <div>
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <SuppressionsIcon className="h-5 w-5 text-slate-400" />
          Suppressions
        </h1>
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
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
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

      <ConfirmDialog
        open={confirmId !== null}
        title="Remove suppression?"
        description="This re-allows the address to receive future campaigns."
        confirmLabel="Remove"
        destructive
        busy={busy}
        onConfirm={confirmedRemove}
        onClose={() => setConfirmId(null)}
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
