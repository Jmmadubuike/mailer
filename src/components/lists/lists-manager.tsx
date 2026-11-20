"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ListDTO {
  id: string;
  name: string;
  description: string | null;
}

export function ListsManager({ lists }: { lists: ListDTO[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [addingTo, setAddingTo] = useState<ListDTO | null>(null);
  const [emails, setEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function createList(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) throw new Error("Failed to create list");
      setName("");
      setDescription("");
      router.refresh();
    } catch {
      setToast("Failed to create list");
    } finally {
      setBusy(false);
    }
  }

  async function addContacts(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!addingTo) return;
    setBusy(true);
    const parsed = emails
      .split(/[\s,]+/)
      .map((email) => email.trim())
      .filter(Boolean);
    try {
      const response = await fetch(
        `/api/lists/${addingTo.id}/add-contacts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emails: parsed }),
        },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Failed to add contacts");
      setToast(`Added ${body.added} contact(s)`);
      setEmails("");
      setAddingTo(null);
      router.refresh();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Failed to add contacts");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mailing Lists</h1>
        <p className="mt-1 text-sm text-slate-500">
          Build audiences that campaigns can target.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <form
          onSubmit={createList}
          className="h-fit space-y-3 rounded-lg border border-slate-200 bg-white p-5"
        >
          <h2 className="text-base font-semibold text-slate-900">New list</h2>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="List name"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Create list
          </button>
        </form>

        <div className="lg:col-span-2 space-y-3">
          {lists.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
              No lists yet. Create your first list, then add contacts to it.
            </div>
          ) : (
            lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{list.name}</p>
                  <p className="text-sm text-slate-500">
                    {list.description ?? "No description"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAddingTo(list);
                    setEmails("");
                  }}
                  className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Add contacts
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {addingTo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setAddingTo(null)}
        >
          <form
            onSubmit={addContacts}
            className="w-full max-w-md space-y-3 rounded-lg bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Add contacts to {addingTo.name}
            </h2>
            <textarea
              value={emails}
              onChange={(event) => setEmails(event.target.value)}
              rows={6}
              placeholder={"one@example.com\ntwo@example.com"}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddingTo(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 rounded-md bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
