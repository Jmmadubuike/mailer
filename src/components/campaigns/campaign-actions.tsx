"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";

export function CampaignActions({
  campaignId,
  status,
  canManage,
  canDelete,
}: {
  campaignId: string;
  status: string;
  canManage: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [testing, setTesting] = useState(false);
  const [to, setTo] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");

  const cancellable = ["draft", "scheduled", "queued", "sending"].includes(status);
  const sendable = ["draft", "scheduled"].includes(status);

  async function sendTest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/campaigns/${campaignId}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to }),
    });
    const body = await response.json().catch(() => null);
    setToast(
      response.ok ? body.message : body?.error ?? "Test failed",
    );
    setTesting(false);
  }

  async function cancel() {
    const response = await fetch(`/api/campaigns/${campaignId}/cancel`, {
      method: "POST",
    });
    if (response.ok) {
      router.refresh();
      setToast("Campaign cancelled");
    }
  }

  async function reschedule() {
    const response = await fetch(`/api/campaigns/${campaignId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt: new Date(scheduledAt).toISOString() }),
    });
    if (response.ok) {
      router.refresh();
      setToast("Campaign rescheduled");
    }
  }

  async function sendNow() {
    const response = await fetch(`/api/campaigns/${campaignId}/send`, {
      method: "POST",
    });
    const body = await response.json().catch(() => null);
    if (response.ok) {
      router.refresh();
      setToast(`Queued ${body.queued} recipient(s) for delivery`);
    } else {
      setToast(body?.error ?? "Failed to send campaign");
    }
  }

  async function duplicate() {
    const response = await fetch(`/api/campaigns/${campaignId}/duplicate`, {
      method: "POST",
    });
    const body = await response.json().catch(() => null);
    if (response.ok && body.campaign?.id) {
      router.push(`/dashboard/campaigns/${body.campaign.id}`);
      router.refresh();
    } else {
      setToast(body?.error ?? "Failed to duplicate campaign");
    }
  }

  async function remove() {
    if (!window.confirm("Delete this campaign and its delivery records?")) return;
    const response = await fetch(`/api/campaigns/${campaignId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      router.push("/dashboard/campaigns");
      router.refresh();
    } else {
      const body = await response.json().catch(() => null);
      setToast(body?.error ?? "Failed to delete campaign");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {canManage && (
          <>
            <button
              type="button"
              onClick={() => setTesting(true)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Send test
            </button>
            <button
              type="button"
              onClick={duplicate}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Duplicate
            </button>
            {sendable && (
              <button
                type="button"
                onClick={sendNow}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Send now
              </button>
            )}
            {cancellable && (
              <button
                type="button"
                onClick={cancel}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Cancel
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={remove}
                className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </>
        )}
      </div>

      {canManage && status === "scheduled" && (
        <div className="mt-3 flex gap-2">
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={reschedule}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reschedule
          </button>
        </div>
      )}

      {testing && (
        <Dialog open onClose={() => setTesting(false)} maxWidthClass="max-w-sm">
          <form onSubmit={sendTest} className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Send test</h2>
            <input
              type="email"
              required
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTesting(false)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Send
              </button>
            </div>
          </form>
        </Dialog>
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
