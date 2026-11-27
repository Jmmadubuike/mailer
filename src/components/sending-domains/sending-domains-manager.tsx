"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Toast } from "@/components/ui/toast";
import { Dialog as Modal } from "@/components/ui/dialog";
import { PlusIcon, SendingDomainsIcon } from "@/components/ui/icons";
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
  const [stats, setStats] = useState<{
    domain: SendingDomainDTO;
    data: DomainStats;
  } | null>(null);
  const [dnsDomain, setDnsDomain] = useState<SendingDomainDTO | null>(null);
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

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <SendingDomainsIcon className="h-5 w-5 text-slate-400" />
            Sending Domains
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Register multiple Resend domains, each with its own sending API
            key and sender identity.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <PlusIcon className="h-4 w-4" />
          Add domain
        </button>
      </div>

      {combined && <CombinedStats stats={combined} />}

      <section className="mt-8">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-700">
            Registered domains
          </h2>
          <span className="text-xs text-slate-500">
            {domains.length} {domains.length === 1 ? "domain" : "domains"}
          </span>
        </div>

        {domains.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">
              No sending domains yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Add your first domain to register it with Resend and start
              sending from your own address.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-5 flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              <PlusIcon className="h-4 w-4" />
              Add your first domain
            </button>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {domains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                busy={busy}
                onVerify={() =>
                  run(
                    `verify:${domain.id}`,
                    () =>
                      api(`/api/sending-domains/${domain.id}/verify`, {
                        method: "POST",
                      }),
                    "Verification requested",
                  )
                }
                onEdit={() => {
                  setEditing(domain);
                  setFormOpen(true);
                }}
                onStats={() => openStats(domain)}
                onDns={() => setDnsDomain(domain)}
                onToggle={() =>
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
                onEmergencyStop={() =>
                  run(
                    `stop:${domain.id}`,
                    () =>
                      api(`/api/sending-domains/${domain.id}/emergency-stop`, {
                        method: "POST",
                        body: JSON.stringify({
                          enabled: !domain.emergencyKillSwitch,
                        }),
                      }),
                    domain.emergencyKillSwitch
                      ? "Emergency stop cleared"
                      : "Emergency stop enabled",
                  )
                }
              />
            ))}
          </div>
        )}
      </section>

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

      {stats && <StatsDialog stats={stats} onClose={() => setStats(null)} />}

      {dnsDomain && (
        <DnsDialog domain={dnsDomain} onClose={() => setDnsDomain(null)} />
      )}

      <Toast
        message={toast?.message ?? null}
        tone={toast?.kind === "error" ? "error" : "default"}
        onDismiss={() => setToast(null)}
      />
    </div>
  );
}

function DomainCard({
  domain,
  busy,
  onVerify,
  onEdit,
  onStats,
  onDns,
  onToggle,
  onEmergencyStop,
}: {
  domain: SendingDomainDTO;
  busy: string | null;
  onVerify: () => void;
  onEdit: () => void;
  onStats: () => void;
  onDns: () => void;
  onToggle: () => void;
  onEmergencyStop: () => void;
}) {
  return (
    <article className="card-hover flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-slate-900">
            {domain.name}
          </h3>
          <p className="truncate text-sm text-slate-500">{domain.domain}</p>
        </div>
        <VerificationBadge status={domain.verificationStatus} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge active={domain.isActive} />
        <CredentialBadge status={domain.credentialStatus} />
        <DmarcBadge status={domain.dmarcStatus} />
        {domain.emergencyKillSwitch && (
          <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Emergency stop
          </span>
        )}
      </div>

      <dl className="mb-5 mt-5 space-y-4 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Default sender
          </dt>
          <dd className="mt-1">
            <p className="font-medium text-slate-800">
              {domain.defaultSenderName || "—"}
            </p>
            <p className="text-xs text-slate-500">
              {domain.defaultSenderAddress || "No sender address set"}
            </p>
            {domain.defaultReplyTo && (
              <p className="text-xs text-slate-500">
                Reply-to: {domain.defaultReplyTo}
              </p>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            API key
          </dt>
          <dd className="mt-1">
            <code className="text-xs text-slate-600">
              {domain.apiKeyHint ?? "Not set"}
            </code>
            <p className="text-xs text-slate-500">
              {domain.permission} · restricted to {domain.domain}
            </p>
          </dd>
        </div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap gap-2">
          <ActionButton
            busy={busy === `verify:${domain.id}`}
            onClick={onVerify}
          >
            Verify
          </ActionButton>
          <ActionButton onClick={onStats}>Stats</ActionButton>
          <ActionButton onClick={onDns}>DNS</ActionButton>
          <ActionButton onClick={onEdit}>Edit</ActionButton>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton
            busy={busy === `toggle:${domain.id}`}
            onClick={onToggle}
          >
            {domain.isActive ? "Deactivate" : "Activate"}
          </ActionButton>
          <ActionButton
            danger
            busy={busy === `stop:${domain.id}`}
            onClick={onEmergencyStop}
          >
            {domain.emergencyKillSwitch ? "Clear stop" : "Emergency stop"}
          </ActionButton>
        </div>
      </div>
    </article>
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
        "inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
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

function DmarcBadge({ status }: { status: SendingDomainDTO["dmarcStatus"] }) {
  const styles: Record<string, string> = {
    present: "bg-emerald-100 text-emerald-700",
    missing: "bg-amber-100 text-amber-700",
    invalid: "bg-red-100 text-red-700",
    unknown: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      dmarc {status}
    </span>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit rounded-full px-2 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600",
      )}
    >
      {active ? "active" : "inactive"}
    </span>
  );
}

function RecordStatusBadge({ status }: { status: string }) {
  const tone =
    status === "verified"
      ? "bg-emerald-100 text-emerald-700"
      : status === "failed"
        ? "bg-red-100 text-red-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone,
      )}
    >
      {status.replace(/_/g, " ")}
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

function DnsDialog({
  domain,
  onClose,
}: {
  domain: SendingDomainDTO;
  onClose: () => void;
}) {
  const records = domain.dnsRecords ?? [];

  return (
    <Dialog onClose={onClose} maxWidthClass="max-w-xl">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          DNS records for {domain.domain}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Add these records at your DNS provider, then verify the domain.
        </p>
      </div>

      {records.length === 0 ? (
        <p className="mt-4 rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-500">
          No DNS records have been returned for this domain yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {records.map((record, index) => (
            <li
              key={`${record.name ?? "record"}-${index}`}
              className="rounded-md border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">
                  {record.name ?? "—"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                    {record.type ?? "TXT"}
                  </span>
                  <RecordStatusBadge status={record.status ?? "not_started"} />
                </div>
              </div>
              <code className="mt-2 block break-all rounded bg-white px-2 py-1.5 text-xs leading-relaxed text-slate-700">
                {record.value ?? "—"}
              </code>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-slate-800">DMARC record</p>
          <DmarcBadge status={domain.dmarcStatus} />
        </div>
        {domain.dmarcStatus === "present" ? (
          <p className="mt-1 text-sm text-slate-500">
            DMARC is published{domain.dmarcPolicy ? ` with policy p=${domain.dmarcPolicy}` : ""}.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-500">
              Add the TXT record below at your DNS provider, then click Verify
              to re-check authentication.
            </p>
            <div className="mt-3 rounded-md bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                TXT record
              </p>
              <code className="mt-1 block break-all text-xs leading-relaxed text-slate-700">
                Name: _dmarc.{domain.domain}
              </code>
              <code className="mt-1 block break-all text-xs leading-relaxed text-slate-700">
                Value: v=DMARC1; p=none;
              </code>
            </div>
          </>
        )}
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
  maxWidthClass = "max-w-lg",
}: {
  children: React.ReactNode;
  onClose: () => void;
  maxWidthClass?: string;
}) {
  return (
    <Modal open onClose={onClose} maxWidthClass={maxWidthClass}>
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
