"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";
import {
  SEGMENT_OPERATORS,
  type SegmentCondition,
  type SegmentGroup,
  type SegmentOperator,
} from "@/modules/segments/evaluate";

interface SegmentDTO {
  id: string;
  name: string;
  description: string | null;
  root: SegmentGroup;
}

const FIELD_SUGGESTIONS = [
  "email",
  "first_name",
  "last_name",
  "company",
  "organization",
  "status",
  "tags",
  "created_at",
  "custom_fields.industry",
];

export function SegmentsManager({ segments }: { segments: SegmentDTO[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function estimate(root: SegmentGroup): Promise<number> {
    const response = await fetch("/api/segments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ root }),
    });
    const body = await response.json();
    return body.count ?? 0;
  }

  async function remove(id: string) {
    await fetch(`/api/segments/${id}`, { method: "DELETE" });
    router.refresh();
    setToast("Segment deleted");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Segments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dynamic audiences evaluated against contact attributes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          New segment
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segments.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No segments yet.
                  </td>
                </tr>
              ) : (
                segments.map((segment) => (
                  <tr key={segment.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {segment.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {segment.description ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <SegmentEstimateButton
                          root={segment.root}
                          estimate={estimate}
                        />
                        <button
                          type="button"
                          onClick={() => remove(segment.id)}
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <CreateSegmentDialog
          estimate={estimate}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
            setToast("Segment created");
          }}
        />
      )}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function SegmentEstimateButton({
  root,
  estimate,
}: {
  root: SegmentGroup;
  estimate: (root: SegmentGroup) => Promise<number>;
}) {
  const [count, setCount] = useState<number | null>(null);
  return (
    <button
      type="button"
      onClick={async () => setCount(await estimate(root))}
      className="rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
    >
      {count === null ? "Estimate" : `${count} recipient${count === 1 ? "" : "s"}`}
    </button>
  );
}

function CreateSegmentDialog({
  estimate,
  onClose,
  onSaved,
}: {
  estimate: (root: SegmentGroup) => Promise<number>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [combinator, setCombinator] = useState<"and" | "or">("and");
  const [rows, setRows] = useState<SegmentCondition[]>([
    { field: "status", operator: "equals" as SegmentOperator, value: "subscribed" },
  ]);
  const [estimateCount, setEstimateCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function buildRoot(): SegmentGroup {
    return { combinator, children: rows };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, root: buildRoot() }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to create segment");
      return;
    }
    onSaved();
  }

  return (
    <Dialog open onClose={onClose} maxWidthClass="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">New segment</h2>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Segment name"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Description"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />

        <div className="flex items-center gap-3 text-sm text-slate-700">
          <span>Match</span>
          <select
            value={combinator}
            onChange={(event) =>
              setCombinator(event.target.value as "and" | "or")
            }
            className="rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-indigo-500"
          >
            <option value="and">all of</option>
            <option value="or">any of</option>
          </select>
          <span>the following conditions</span>
        </div>

        <div className="space-y-2">
          {rows.map((row, index) => (
            <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                list="segment-fields"
                value={row.field}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((r, i) =>
                      i === index ? { ...r, field: event.target.value } : r,
                    ),
                  )
                }
                placeholder="field"
                aria-label="Field"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 sm:w-44"
              />
              <select
                value={row.operator}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((r, i) =>
                      i === index
                        ? { ...r, operator: event.target.value as SegmentOperator }
                        : r,
                    ),
                  )
                }
                aria-label="Operator"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 sm:w-40"
              >
                {SEGMENT_OPERATORS.map((operator) => (
                  <option key={operator} value={operator}>
                    {operator.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <input
                value={String(row.value ?? "")}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((r, i) =>
                      i === index ? { ...r, value: event.target.value } : r,
                    ),
                  )
                }
                placeholder="value"
                aria-label="Value"
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-indigo-500 sm:flex-1"
              />
              <button
                type="button"
                onClick={() =>
                  setRows((current) => current.filter((_, i) => i !== index))
                }
                className="w-fit rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <datalist id="segment-fields">
          {FIELD_SUGGESTIONS.map((field) => (
            <option key={field} value={field} />
          ))}
        </datalist>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setRows((current) => [
                ...current,
                { field: "email", operator: "contains", value: "" },
              ])
            }
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Add condition
          </button>
          <button
            type="button"
            onClick={async () => setEstimateCount(await estimate(buildRoot()))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {estimateCount === null ? "Estimate" : `${estimateCount} recipients`}
          </button>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create segment
          </button>
        </div>
      </form>
    </Dialog>
  );
}
