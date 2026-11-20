"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EmailComposer } from "@/components/editor/email-composer";
import {
  applyTemplateColors,
  DEFAULT_TEMPLATE_COLORS,
  type TemplateColors,
} from "@/lib/templates/colors";

export interface TemplateDTO {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  subject: string;
  previewText: string | null;
  htmlContent: string;
  textContent: string | null;
  colors: TemplateColors | null;
}

export function TemplatesManager({
  templates,
  canEdit,
  isOwner,
}: {
  templates: TemplateDTO[];
  canEdit: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<TemplateDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function seed() {
    const response = await fetch("/api/templates/seed", { method: "POST" });
    const body = await response.json();
    setToast(`Seeded ${body.created} starter template(s)`);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    router.refresh();
    setToast("Template deleted");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Templates</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reusable emails with personalization variables.
          </p>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={seed}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Seed starters
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setCreating(true);
              }}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              New template
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.length === 0 ? (
          <div className="col-span-full rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
            No templates yet. Seed the starter set or create your own.
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="rounded-lg border border-slate-200 bg-white p-5"
            >
              <p className="font-medium text-slate-900">{template.name}</p>
              <p className="text-xs text-slate-500">{template.category ?? "Uncategorized"}</p>
              <p className="mt-2 truncate text-sm text-slate-600">{template.subject}</p>
              <div className="mt-4 flex gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setEditing(template)}
                    className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => remove(template.id)}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {(creating || editing) && (
        <TemplateEditor
          template={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
            setToast("Template saved");
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function TemplateEditor({
  template,
  onClose,
  onSaved,
}: {
  template: TemplateDTO | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState(template?.category ?? "");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [html, setHtml] = useState(template?.htmlContent ?? "");
  const [colors, setColors] = useState<TemplateColors>(
    template?.colors ?? DEFAULT_TEMPLATE_COLORS,
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const path = template ? `/api/templates/${template.id}` : "/api/templates";
    const response = await fetch(path, {
      method: template ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, subject, htmlContent: html, colors }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to save");
      return;
    }
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92vh] w-full max-w-5xl flex-col gap-3 overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {template ? "Edit template" : "New template"}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className={inputClass} />
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" className={inputClass} />
        </div>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required className={inputClass} />

        <div className="grid gap-3 sm:grid-cols-3">
          <ColorField label="Primary" value={colors.primary} onChange={(value) => setColors({ ...colors, primary: value })} />
          <ColorField label="Background" value={colors.background} onChange={(value) => setColors({ ...colors, background: value })} />
          <ColorField label="Text" value={colors.text} onChange={(value) => setColors({ ...colors, text: value })} />
        </div>

        <EmailComposer
          initialHtml={html}
          onChange={setHtml}
          previewTransform={(value) => applyTemplateColors(value, colors)}
        />

        <p className="text-xs text-slate-500">
          Variables: {"{{first_name}} {{last_name}} {{email}} {{company}} {{organization}} {{unsubscribe_url}} {{current_year}} {{custom_fields.x}}"}
        </p>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Save
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white"
      />
      {label}
    </label>
  );
}
