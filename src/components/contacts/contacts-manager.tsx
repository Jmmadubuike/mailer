"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface ContactDTO {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string;
  tags: string[];
  createdAt: string;
}

export function ContactsManager({
  initialContacts,
  initialTotal,
}: {
  initialContacts: ContactDTO[];
  initialTotal: number;
}) {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactDTO[]>(initialContacts);
  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async (pageNumber: number, search: string) => {
    const params = new URLSearchParams({
      page: String(pageNumber),
      q: search,
    });
    const response = await fetch(`/api/contacts?${params}`);
    const body = await response.json();
    setContacts(body.contacts);
    setTotal(body.total);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    load(page, query);
  }

  async function remove(id: string) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    router.refresh();
    load(page, query);
    setToast("Contact deleted");
  }

  async function bulkDelete() {
    const response = await fetch("/api/contacts/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selected }),
    });
    if (response.ok) {
      setSelected([]);
      router.refresh();
      load(page, query);
      setToast("Contacts deleted");
    }
  }

  async function exportCsv() {
    const response = await fetch("/api/contacts/export");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "contacts.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contacts</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} contact{total === 1 ? "" : "s"} in the central database.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={bulkDelete}
              className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              Delete selected ({selected.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add contact
          </button>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          load(1, query);
        }}
        className="mt-6 flex gap-2"
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by email…"
          className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Search
        </button>
      </form>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">
                  <input
                    type="checkbox"
                    checked={
                      contacts.length > 0 &&
                      contacts.every((contact) => selected.includes(contact.id))
                    }
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? contacts.map((contact) => contact.id)
                          : [],
                      )
                    }
                  />
                </th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    No contacts found.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(contact.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked
                              ? [...current, contact.id]
                              : current.filter((id) => id !== contact.id),
                          )
                        }
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {contact.email}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {[contact.firstName, contact.lastName]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={contact.status}
                        onChange={(event) =>
                          updateStatus(contact.id, event.target.value)
                        }
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 outline-none focus:border-indigo-500"
                      >
                        <option value="subscribed">subscribed</option>
                        <option value="unsubscribed">unsubscribed</option>
                        <option value="suppressed">suppressed</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {contact.tags.join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => remove(contact.id)}
                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>
          Page {page} of {pages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((current) => Math.min(pages, current + 1))}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {showCreate && (
        <CreateContactDialog
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            router.refresh();
            load(page, query);
            setToast("Contact created");
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

function CreateContactDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, lastName }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to create contact");
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
        className="w-full max-w-sm space-y-3 rounded-lg bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">Add contact</h2>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="First name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          placeholder="Last name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
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
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
