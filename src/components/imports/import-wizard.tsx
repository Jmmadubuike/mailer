"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseImportFile, type ParsedFile } from "@/lib/imports/client";

interface ListOption {
  id: string;
  name: string;
}

interface ImportResult {
  imported: number;
  updated: number;
  skipped: number;
  duplicates: number;
  invalid: number;
  report: Array<{ email: string; status: string; reason: string }>;
}

export function ImportWizard({ lists }: { lists: ListOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState({
    email: "",
    firstName: "",
    lastName: "",
    tags: "",
  });
  const [customFields, setCustomFields] = useState<Array<[string, string]>>([]);
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update" | "new_only">("skip");
  const [consent, setConsent] = useState(false);
  const [listId, setListId] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    try {
      const data = await parseImportFile(file);
      setParsed(data);
      const guess = (name: string) =>
        data.columns.find((column) => column.toLowerCase() === name) ?? "";
      setMapping({
        email: guess("email"),
        firstName: guess("firstname") || guess("first_name") || guess("first name"),
        lastName: guess("lastname") || guess("last_name") || guess("last name"),
        tags: guess("tags"),
      });
      setStep(1);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Failed to parse file");
    }
  }

  async function run() {
    if (!parsed) return;
    setBusy(true);
    setError(null);
    const response = await fetch("/api/imports/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rows: parsed.rows,
        mapping: {
          ...mapping,
          customFields: Object.fromEntries(customFields.filter(([key]) => key)),
        },
        duplicateMode,
        confirmConsent: consent,
        listId: listId || undefined,
      }),
    });
    const body = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setError(body?.error ?? "Import failed");
      return;
    }
    setResult(body);
    setStep(2);
    router.refresh();
  }

  if (step === 2 && result) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Import report</h1>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Imported" value={result.imported} />
          <Stat label="Updated" value={result.updated} />
          <Stat label="Skipped" value={result.skipped} />
          <Stat label="Duplicates" value={result.duplicates} />
          <Stat label="Invalid" value={result.invalid} />
        </div>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {result.report.map((row, index) => (
                  <tr key={`${row.email}-${index}`}>
                    <td className="px-4 py-2 text-slate-700">{row.email}</td>
                    <td className="px-4 py-2 text-slate-600">{row.status}</td>
                    <td className="px-4 py-2 text-slate-600">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setParsed(null);
            setResult(null);
            setStep(0);
          }}
          className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Import another file
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Import contacts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload a CSV or XLSX file, map its columns, and confirm before importing.
        </p>
      </div>

      {step === 0 && (
        <div className="mt-6 rounded-lg border-2 border-dashed border-slate-300 bg-white p-10 text-center">
          <input
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="text-sm text-slate-600"
          />
          <p className="mt-3 text-xs text-slate-500">
            The first row must contain column headers.
          </p>
        </div>
      )}

      {step === 1 && parsed && (
        <div className="mt-6 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Map columns</h2>
            <p className="mt-1 text-sm text-slate-500">
              {parsed.rows.length} row{parsed.rows.length === 1 ? "" : "s"} found.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ColumnSelect label="Email (required)" value={mapping.email} onChange={(value) => setMapping({ ...mapping, email: value })} columns={parsed.columns} />
              <ColumnSelect label="First name" value={mapping.firstName} onChange={(value) => setMapping({ ...mapping, firstName: value })} columns={parsed.columns} />
              <ColumnSelect label="Last name" value={mapping.lastName} onChange={(value) => setMapping({ ...mapping, lastName: value })} columns={parsed.columns} />
              <ColumnSelect label="Tags" value={mapping.tags} onChange={(value) => setMapping({ ...mapping, tags: value })} columns={parsed.columns} />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Custom fields</h2>
            <div className="mt-3 space-y-2">
              {customFields.map(([key, column], index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={key}
                    onChange={(event) =>
                      setCustomFields((current) =>
                        current.map((entry, i) => (i === index ? [event.target.value, entry[1]] : entry)),
                      )
                    }
                    placeholder="Field name"
                    className="w-40 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                  />
                  <select
                    value={column}
                    onChange={(event) =>
                      setCustomFields((current) =>
                        current.map((entry, i) => (i === index ? [entry[0], event.target.value] : entry)),
                      )
                    }
                    className="flex-1 rounded-md border border-slate-300 px-2 py-2 text-sm outline-none focus:border-indigo-500"
                  >
                    <option value="">— not mapped —</option>
                    {parsed.columns.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setCustomFields((current) => current.filter((_, i) => i !== index))} className="rounded-md border border-slate-200 px-2 text-xs text-slate-600">×</button>
                </div>
              ))}
              <button type="button" onClick={() => setCustomFields((current) => [...current, ["", ""]])} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Add custom field
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">Options</h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {(["skip", "update", "new_only"] as const).map((mode) => (
                <label key={mode} className="flex items-center gap-2">
                  <input type="radio" checked={duplicateMode === mode} onChange={() => setDuplicateMode(mode)} />
                  {mode === "skip" && "Skip existing contacts"}
                  {mode === "update" && "Update existing contacts"}
                  {mode === "new_only" && "Import only new contacts"}
                </label>
              ))}
            </div>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">Add to mailing list</label>
              <select value={listId} onChange={(event) => setListId(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500">
                <option value="">— none —</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>{list.name}</option>
                ))}
              </select>
            </div>
            <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5" />
              I confirm these contacts consented to receive communications from us.
            </label>
          </div>

          {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setStep(0)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Back
            </button>
            <button type="button" onClick={run} disabled={!mapping.email || !consent || busy} className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60">
              {busy ? "Importing…" : "Confirm import"}
            </button>
          </div>
        </div>
      )}

      {error && step === 0 && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}

function ColumnSelect({ label, value, onChange, columns }: { label: string; value: string; onChange: (value: string) => void; columns: string[] }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500">
        <option value="">— not mapped —</option>
        {columns.map((column) => (
          <option key={column} value={column}>{column}</option>
        ))}
      </select>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
