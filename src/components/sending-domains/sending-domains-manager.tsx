"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Toast } from "@/components/ui/toast";
import { Dialog as Modal } from "@/components/ui/dialog";
import type {
  DomainStats,
  SendingDomainDTO,
} from "@/types/sending-domain";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed");
  }
  return body as T;
}

export function SendingDomainsManager({
  domains: initialDomains,
}: {
  domains: SendingDomainDTO[];
}) {
  const router = useRouter();
  const [domains, setDomains] = useState(initialDomains);
  const [combined, setCombined] = useState<DomainStats | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SendingDomainDTO | null>(null);
  const [testing, setTesting] = useState<SendingDomainDTO | null>(null);
  const [stats, setStats] = useState<{
    domain: SendingDomainDTO;
    data: DomainStats;
  } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  const reload = useCallback(async () => {
    const [list, statsData] = await Promise.all([
      api<{ domains: SendingDomainDTO[] }>("/api/sending-domains"),
      api<{ stats: DomainStats }>("/api/sending-domains/stats"),
    ]);
    setDomains(list.domains);
    setCombined(statsData.stats);
    router.refresh();
  }, [router]);

  useEffect(() => {
    api<{ stats: DomainStats }>("/api/sending-domains/stats")
      .then((body) => setCombined(body.stats))
      .catch(() => setCombined(null));
  }, []);

  async function run(
    key: string,
    task: () => Promise<void>,
    success: string,
  ) {
    setBusy(key);
    try {
      await task();
      await reload();
      setToast({ kind: "success", message: success });
    } catch (error) {
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setBusy(null);
    }
  }

  async function openStats(domain: SendingDomainDTO) {
    try {
      const body = await api<{ stats: DomainStats }>(
        `/api/sending-domains/${domain.id}/stats`,
      );
      setStats({ domain, data: body.stats });
    } catch (error) {
      setToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Failed to load stats",
      });
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Sending Domains
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register multiple Resend domains, each with its own sending API
            key and sender identity.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add domain
        </button>
      </div>

      {combined && <CombinedStats stats={combined} />}

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">API key</th>
                <th className="px-4 py-3 font-medium">Default sender</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {domains.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No sending domains yet. Add your first domain to get
                    started.
                  </td>
                </tr>
              ) : (
                domains.map((domain) => (
                  <tr key={domain.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {domain.name}
                      </p>
                      <p className="text-xs text-slate-500">{domain.domain}</p>
                    </td>
                    <td className="px-4 py-3">
                      <VerificationBadge status={domain.verificationStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge active={domain.isActive} />
                        {domain.emergencyKillSwitch && (
                          <span className="inline-flex w-fit rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Emergency stop
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <code className="text-xs text-slate-600">
                          {domain.apiKeyHint ?? "—"}
                        </code>
                        <CredentialBadge status={domain.credentialStatus} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-700">
                        {domain.defaultSenderName ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {domain.defaultSenderAddress ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <ActionButton
                          busy={busy === `verify:${domain.id}`}
                          onClick={() =>
                            run(
                              `verify:${domain.id}`,
                              () =>
                                api(
                                  `/api/sending-domains/${domain.id}/verify`,
                                  { method: "POST" },
                                ),
                              "Verification requested",
                            )
                          }
                        >
                          Verify
                        </ActionButton>
                        <ActionButton
                          busy={busy === `test:${domain.id}`}
                          onClick={() => setTesting(domain)}
                        >
                          Test
                        </ActionButton>
                        <ActionButton onClick={() => openStats(domain)}>
                          Stats
                        </ActionButton>
                        <ActionButton
                          onClick={() => {
                            setEditing(domain);
                            setFormOpen(true);
                          }}
                        >
                          Edit
                        </ActionButton>
                        <ActionButton
                          busy={busy === `toggle:${domain.id}`}
                          onClick={() =>
                            run(
                              `toggle:${domain.id}`,
                              () =>
                                api(
                                  domain.isActive
                                    ? `/api/sending-domains/${domain.id}/deactivate`
                                    : `/api/sending-domains/${domain.id}/activate`,
                                  { method: "POST" },
                                ),
                              domain.isActive ? "Domain deactivated" : "Domain activated",
                            )
                          }
                        >
                          {domain.isActive ? "Deactivate" : "Activate"}
                        </ActionButton>
                        <ActionButton
                          danger
                          busy={busy === `stop:${domain.id}`}
                          onClick={() =>
                            run(
                              `stop:${domain.id}`,
                              () =>
                                api(
                                  `/api/sending-domains/${domain.id}/emergency-stop`,
                                  {
                                    method: "POST",
                                    body: JSON.stringify({
                                      enabled: !domain.emergencyKillSwitch,
                                    }),
                                  },
                                ),
                              domain.emergencyKillSwitch
                                ? "Emergency stop cleared"
                                : "Emergency stop enabled",
                            )
                          }
                        >
                          {domain.emergencyKillSwitch
                            ? "Clear stop"
                            : "Emergency stop"}
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <DomainFormDialog
          domain={editing}
          busy={busy === "form"}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setBusy("form");
            try {
              await reload();
              setFormOpen(false);
              setToast({ kind: "success", message: "Domain saved" });
            } finally {
              setBusy(null);
            }
          }}
          onSubmit={async (values) => {
            const path = editing
              ? `/api/sending-domains/${editing.id}`
              : "/api/sending-domains";
            await api(path, {
              method: editing ? "PATCH" : "POST",
              body: JSON.stringify(values),
            });
          }}
        />
      )}

      {testing && (
        <TestDialog
          domain={testing}
          onClose={() => setTesting(null)}
          onDone={(message, kind) => {
            setTesting(null);
            setToast({ kind, message });
            reload();
          }}
        />
      )}

      {stats && (
        <StatsDialog
          stats={stats}
          onClose={() => setStats(null)}
        />
      )}

      <Toast
        message={toast?.message ?? null}
        tone={toast?.kind === "error" ? "error" : "default"}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}

function CombinedStats({ stats }: { stats: DomainStats }) {
  const items: Array<[string, string | number]> = [
    ["Total recipients", stats.totalRecipients],
    ["Sent", stats.sent],
    ["Delivered", stats.delivered],
    ["Bounces", stats.bounced],
    ["Opens", stats.opens],
    ["Clicks", stats.clicks],
    ["Delivery rate", `${(stats.deliveryRate * 100).toFixed(1)}%`],
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="card-hover rounded-lg border border-slate-200 bg-white px-4 py-3"
        >
          <p className="text-xs text-slate-500">{label}</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}

function VerificationBadge({
  status,
}: {
  status: SendingDomainDTO["verificationStatus"];
}) {
  const styles: Record<string, string> = {
    verified: "bg-emerald-100 text-emerald-700",
    partially_verified: "bg-amber-100 text-amber-700",
    pending: "bg-slate-100 text-slate-600",
    not_started: "bg-slate-100 text-slate-600",
    partially_failed: "bg-red-100 text-red-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function CredentialBadge({
  status,
}: {
  status: SendingDomainDTO["credentialStatus"];
}) {
  const styles: Record<string, string> = {
    ok: "bg-emerald-100 text-emerald-700",
    invalid: "bg-red-100 text-red-700",
    revoked: "bg-red-100 text-red-700",
    unknown: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium",
        active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600",
      )}
    >
      {active ? "active" : "inactive"}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  busy = false,
  danger = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-2 text-xs font-medium transition-colors disabled:opacity-60",
        danger
          ? "border-red-200 text-red-700 hover:bg-red-50"
          : "border-slate-200 text-slate-700 hover:bg-slate-50",
      )}
    >
      {busy ? "…" : children}
    </button>
  );
}

type DomainFormValues = {
  name: string;
  domain?: string;
  apiKey: string;
  defaultSenderName: string;
  defaultSenderAddress: string;
  defaultReplyTo: string;
};

function DomainFormDialog({
  domain,
  busy,
  onSubmit,
  onSaved,
  onClose,
}: {
  domain: SendingDomainDTO | null;
  busy: boolean;
  onSubmit: (values: DomainFormValues) => Promise<void>;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const [values, setValues] = useState<DomainFormValues>({
    name: domain?.name ?? "",
    domain: domain?.domain ?? "",
    apiKey: "",
    defaultSenderName: domain?.defaultSenderName ?? "",
    defaultSenderAddress: domain?.defaultSenderAddress ?? "",
    defaultReplyTo: domain?.defaultReplyTo ?? "",
  });
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof DomainFormValues>(
    key: K,
    value: DomainFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit(values);
      await onSaved();
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Failed to save",
      );
    }
  }

  return (
    <Dialog onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {domain ? "Edit sending domain" : "Add sending domain"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {domain
              ? "Update the sender identity or rotate the API key."
              : "Register the domain with Resend and attach its sending key."}
          </p>
        </div>

        <Field label="Name">
          <Input
            required
            value={values.name}
            onChange={(value) => update("name", value)}
            placeholder="Newsletter"
          />
        </Field>

        <Field label="Domain">
          <Input
            required
            disabled={!!domain}
            value={values.domain ?? ""}
            onChange={(value) => update("domain", value)}
            placeholder="news.example.com"
          />
        </Field>

        <Field label="Resend API key (domain-restricted)">
          <Input
            type="password"
            value={values.apiKey}
            onChange={(value) => update("apiKey", value)}
            placeholder={
              domain ? "Leave blank to keep the current key" : "re_••••••••"
            }
          />
        </Field>

        <Field label="Default sender name">
          <Input
            value={values.defaultSenderName}
            onChange={(value) => update("defaultSenderName", value)}
            placeholder="Acme Updates"
          />
        </Field>

        <Field label="Default sender address">
          <Input
            type="email"
            value={values.defaultSenderAddress}
            onChange={(value) => update("defaultSenderAddress", value)}
            placeholder="updates@news.example.com"
          />
        </Field>

        <Field label="Default reply-to">
          <Input
            type="email"
            value={values.defaultReplyTo}
            onChange={(value) => update("defaultReplyTo", value)}
            placeholder="support@example.com"
          />
        </Field>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Saving…" : domain ? "Save changes" : "Register domain"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function TestDialog({
  domain,
  onDone,
  onClose,
}: {
  domain: SendingDomainDTO;
  onDone: (message: string, kind: "success" | "error") => void;
  onClose: () => void;
}) {
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = await api<{ ok: boolean; message: string }>(
        `/api/sending-domains/${domain.id}/test`,
        { method: "POST", body: JSON.stringify({ to }) },
      );
      onDone(body.message, body.ok ? "success" : "error");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Test failed",
      );
      setBusy(false);
    }
  }

  return (
    <Dialog onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Test {domain.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Send a connectivity test email through this domain&apos;s API key.
          </p>
        </div>

        <Field label="Recipient email">
          <Input
            type="email"
            required
            value={to}
            onChange={setTo}
            placeholder="you@example.com"
          />
        </Field>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send test"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function StatsDialog({
  stats,
  onClose,
}: {
  stats: { domain: SendingDomainDTO; data: DomainStats };
  onClose: () => void;
}) {
  const { data } = stats;
  const rows: Array<[string, string | number]> = [
    ["Total recipients", data.totalRecipients],
    ["Sent", data.sent],
    ["Delivered", data.delivered],
    ["Bounced", data.bounced],
    ["Complaints", data.complaints],
    ["Opens", data.opens],
    ["Clicks", data.clicks],
    ["Unsubscribes", data.unsubscribes],
    ["Failed", data.failed],
    ["Delivery rate", `${(data.deliveryRate * 100).toFixed(1)}%`],
    ["Bounce rate", `${(data.bounceRate * 100).toFixed(1)}%`],
    ["Open rate", `${(data.openRate * 100).toFixed(1)}%`],
    ["Click rate", `${(data.clickRate * 100).toFixed(1)}%`],
  ];

  return (
    <Dialog onClose={onClose}>
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Stats for {stats.domain.name}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Aggregated from recipient delivery records.
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md bg-slate-50 px-3 py-2">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-base font-semibold text-slate-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </Dialog>
  );
}

function Dialog({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <Modal open onClose={onClose} maxWidthClass="max-w-lg">
      {children}
    </Modal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      required={required}
      disabled={disabled}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100 disabled:text-slate-500"
    />
  );
}
