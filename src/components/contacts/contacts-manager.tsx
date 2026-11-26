"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Toast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/dialog";
import { ContactsIcon } from "@/components/ui/icons";

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
  const [confirm, setConfirm] = useState<{ id?: string; bulk: boolean } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

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

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    load(page, query);
  }

  function remove(id: string) {
    setConfirm({ id, bulk: false });
  }

  function bulkDelete() {
    setConfirm({ bulk: true });
  }

  async function confirmedDelete() {
    if (!confirm) return;
    setBusy(true);
    const response = confirm.bulk
      ? await fetch("/api/contacts/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selected }),
        })
      : await fetch(`/api/contacts/${confirm.id}`, { method: "DELETE" });
    setBusy(false);
    if (!response.ok) {
      setConfirm(null);
      setToast("Delete failed");
      return;
    }
    if (confirm.bulk) setSelected([]);
    setConfirm(null);
    router.refresh();
    load(page, query);
    setToast(confirm.bulk ? "Contacts deleted" : "Contact deleted");
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
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <ContactsIcon className="h-5 w-5 text-slate-400" />
            Contacts
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {total} contact{total === 1 ? "" : "s"} in the central database.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        className="mt-6 flex flex-wrap gap-2"
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

      <div className="mt-4 space-y-3 md:hidden">
        {contacts.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No contacts found.
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">
                    {contact.email}
                  </p>
                  <p className="truncate text-sm text-slate-600">
                    {[contact.firstName, contact.lastName]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {contact.tags.join(", ") || "No tags"}
                  </p>
                </div>
                <input
                  type="checkbox"
                  aria-label={`Select ${contact.email}`}
                  checked={selected.includes(contact.id)}
                  onChange={(event) =>
                    setSelected((current) =>
                      event.target.checked
                        ? [...current, contact.id]
                        : current.filter((id) => id !== contact.id),
                    )
                  }
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <select
                  aria-label="Status"
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
                <button
                  type="button"
                  onClick={() => remove(contact.id)}
                  className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block">
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
                        className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50"
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

      <ConfirmDialog
        open={confirm !== null}
        title={confirm?.bulk ? "Delete selected contacts?" : "Delete contact?"}
        description={
          confirm?.bulk
            ? `This permanently deletes ${selected.length} contact(s).`
            : "This permanently deletes the contact."
        }
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={confirmedDelete}
        onClose={() => setConfirm(null)}
      />

      <Toast message={toast} onDismiss={() => setToast(null)} />
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
    <Dialog open onClose={onClose} maxWidthClass="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Add contact</h2>
        <input
          type="email"
          required
          aria-label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          value={firstName}
          aria-label="First name"
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="First name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
        />
        <input
          value={lastName}
          aria-label="Last name"
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
    </Dialog>
  );
}
