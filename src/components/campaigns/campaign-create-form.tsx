"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SendableDomainOption } from "@/types/sending-domain";
import { EmailComposer } from "@/components/editor/email-composer";
import {
  applyTemplateColors,
  DEFAULT_TEMPLATE_COLORS,
  type TemplateColors,
} from "@/lib/templates/colors";

export function CampaignCreateForm({
  domains,
  lists,
  segments,
  templates,
}: {
  domains: SendableDomainOption[];
  lists: Array<{ id: string; name: string }>;
  segments: Array<{ id: string; name: string }>;
  templates: Array<{
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent: string | null;
    colors: TemplateColors | null;
  }>;
}) {
  const router = useRouter();
  const [sendingDomainId, setSendingDomainId] = useState(domains[0]?.id ?? "");
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [sendMode, setSendMode] = useState<"draft" | "now" | "scheduled">(
    "draft",
  );
  const [scheduledAt, setScheduledAt] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [subject, setSubject] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const selectedDomain = domains.find(
    (domain) => domain.id === sendingDomainId,
  );
  const defaultSender = selectedDomain?.defaultSenderAddress ?? "";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      subject,
      fromName: String(form.get("fromName") ?? ""),
      fromEmail: String(form.get("fromEmail") ?? ""),
      replyTo: String(form.get("replyTo") ?? "") || undefined,
      previewText: String(form.get("previewText") ?? "") || undefined,
      htmlContent: htmlContent || undefined,
      textContent: String(form.get("textContent") ?? "") || undefined,
      sendingDomainId,
      selectedLists,
      selectedSegments,
      sendMode,
      scheduledAt:
        sendMode === "scheduled" && scheduledAt
          ? new Date(scheduledAt).toISOString()
          : undefined,
    };

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error ?? "Failed to create campaign");
        return;
      }
      router.push("/dashboard/campaigns");
      router.refresh();
    } catch {
      setError("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Create campaign
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a verified sending domain and its sender identity.
        </p>
      </div>

      <Section title="Sending identity">
        <Field label="Sending domain" htmlFor="sending-domain">
          <select
            id="sending-domain"
            value={sendingDomainId}
            onChange={(event) => setSendingDomainId(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            {domains.length === 0 && <option value="">No verified domains</option>}
            {domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name} ({domain.domain})
              </option>
            ))}
          </select>
          {domains.length === 0 && (
            <p className="mt-2 text-sm text-amber-600">
              No verified sending domains yet.{" "}
              <Link
                href="/dashboard/sending-domains"
                className="font-medium underline"
              >
                Add and verify a domain
              </Link>{" "}
              first.
            </p>
          )}
        </Field>
        <Field label="Sender name" htmlFor="sender-name">
          <TextInput
            name="fromName"
            id="sender-name"
            defaultValue={selectedDomain?.defaultSenderName ?? ""}
            required
          />
        </Field>
        <Field label="Sender email" htmlFor="sender-email">
          <TextInput
            name="fromEmail"
            id="sender-email"
            type="email"
            defaultValue={defaultSender}
            required
          />
        </Field>
        <Field label="Reply-to email" htmlFor="reply-to">
          <TextInput
            name="replyTo"
            id="reply-to"
            type="email"
            defaultValue={selectedDomain?.defaultReplyTo ?? ""}
          />
        </Field>
      </Section>

      <Section title="Message">
        <Field label="Start from a template" htmlFor="start-template">
          <select
            id="start-template"
            defaultValue=""
            onChange={(event) => {
              const template = templates.find((t) => t.id === event.target.value);
              if (!template) return;
              setSubject(template.subject);
              setHtmlContent(
                applyTemplateColors(
                  template.htmlContent,
                  template.colors ?? DEFAULT_TEMPLATE_COLORS,
                ),
              );
            }}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          >
            <option value="">Blank</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Campaign name" htmlFor="campaign-name">
          <TextInput name="name" id="campaign-name" required />
        </Field>
        <Field label="Subject" htmlFor="subject">
          <TextInput
            name="subject"
            id="subject"
            value={subject}
            onChange={setSubject}
            required
          />
        </Field>
        <Field label="Preview text" htmlFor="preview-text">
          <TextInput name="previewText" id="preview-text" />
        </Field>
        <Field label="HTML content">
          <EmailComposer initialHtml={htmlContent} onChange={setHtmlContent} />
        </Field>
      </Section>

      <Section title="Audience">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Mailing lists
          </p>
          {lists.length === 0 ? (
            <p className="text-sm text-slate-500">
              No mailing lists yet. Create one first.
            </p>
          ) : (
            <div className="space-y-2">
              {lists.map((list) => (
                <label
                  key={list.id}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedLists.includes(list.id)}
                    onChange={(event) =>
                      setSelectedLists((current) =>
                        event.target.checked
                          ? [...current, list.id]
                          : current.filter((id) => id !== list.id),
                      )
                    }
                  />
                  {list.name}
                </label>
              ))}
            </div>
          )}
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Segments</p>
          {segments.length === 0 ? (
            <p className="text-sm text-slate-500">
              No segments yet. You can target lists only.
            </p>
          ) : (
            <div className="space-y-2">
              {segments.map((segment) => (
                <label
                  key={segment.id}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedSegments.includes(segment.id)}
                    onChange={(event) =>
                      setSelectedSegments((current) =>
                        event.target.checked
                          ? [...current, segment.id]
                          : current.filter((id) => id !== segment.id),
                      )
                    }
                  />
                  {segment.name}
                </label>
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Scheduling">
        <div className="space-y-2">
          {(["draft", "now", "scheduled"] as const).map((mode) => (
            <label
              key={mode}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <input
                type="radio"
                name="sendMode"
                checked={sendMode === mode}
                onChange={() => setSendMode(mode)}
              />
              {mode === "draft" && "Save as draft"}
              {mode === "now" && "Send immediately"}
              {mode === "scheduled" && "Schedule for later"}
            </label>
          ))}
        </div>
        {sendMode === "scheduled" && (
          <Field label="Send at" htmlFor="scheduled-at">
            <TextInput
              name="scheduledAt"
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(value) => setScheduledAt(value)}
              required
            />
          </Field>
        )}
      </Section>

      {error && (
        <p
          role="alert"
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending
            ? "Working…"
            : sendMode === "draft"
              ? "Save draft"
              : sendMode === "now"
                ? "Create and send"
                : "Schedule campaign"}
        </button>
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  name,
  id,
  type = "text",
  defaultValue,
  value,
  onChange,
  required = false,
}: {
  name: string;
  id?: string;
  type?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  if (value !== undefined && onChange) {
    return (
      <input
        name={name}
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
      />
    );
  }
  return (
    <input
      name={name}
      id={id}
      type={type}
      required={required}
      defaultValue={defaultValue}
      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
    />
  );
}
