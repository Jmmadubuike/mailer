"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/ui/password-input";

interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
}

export function TeamManager({
  users,
  currentUserId,
  role,
}: {
  users: UserDTO[];
  currentUserId: string;
  role: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [passwordFor, setPasswordFor] = useState<UserDTO | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const isOwner = role === "owner";

  async function patch(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      router.refresh();
    } else {
      setToast("Failed to update user");
    }
  }

  async function remove(id: string) {
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (response.ok) {
      router.refresh();
      setToast("User removed");
    } else {
      setToast("Could not remove user");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Team Members</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage administrative accounts and roles.
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Invite user
          </button>
        )}
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    {isOwner && user.id !== currentUserId ? (
                      <select
                        value={user.role}
                        onChange={(event) =>
                          patch(user.id, { role: event.target.value })
                        }
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 outline-none focus:border-indigo-500"
                      >
                        <option value="owner">owner</option>
                        <option value="administrator">administrator</option>
                        <option value="campaign_manager">campaign_manager</option>
                        <option value="viewer">viewer</option>
                      </select>
                    ) : (
                      <span className="text-slate-600">{user.role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.isActive ? "active" : "disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPasswordFor(user)}
                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Reset password
                      </button>
                      {isOwner && user.id !== currentUserId && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              patch(user.id, { isActive: !user.isActive })
                            }
                            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            {user.isActive ? "Disable" : "Enable"}
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(user.id)}
                            className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <CreateUserDialog
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
            setToast("User created");
          }}
        />
      )}

      {passwordFor && (
        <PasswordDialog
          user={passwordFor}
          onClose={() => setPasswordFor(null)}
          onSaved={() => {
            setPasswordFor(null);
            setToast("Password updated");
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

function CreateUserDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("administrator");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Failed to create user");
      return;
    }
    onSaved();
  }

  return (
    <Dialog onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Invite user</h2>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className={inputClass} />
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={inputClass} />
        <PasswordInput value={password} onChange={setPassword} placeholder="Temporary password (min 8)" required minLength={8} autoComplete="new-password" />
        <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
          <option value="owner">owner</option>
          <option value="administrator">administrator</option>
          <option value="campaign_manager">campaign_manager</option>
          <option value="viewer">viewer</option>
        </select>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryClass}>Cancel</button>
          <button type="submit" className={primaryClass}>Create</button>
        </div>
      </form>
    </Dialog>
  );
}

function PasswordDialog({
  user,
  onClose,
  onSaved,
}: {
  user: UserDTO;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/users/${user.id}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError("Failed to update password");
      return;
    }
    onSaved();
  }

  return (
    <Dialog onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Reset password for {user.email}
        </h2>
        <PasswordInput value={password} onChange={setPassword} placeholder="New password (min 8)" required minLength={8} autoComplete="new-password" />
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={secondaryClass}>Cancel</button>
          <button type="submit" className={primaryClass}>Update</button>
        </div>
      </form>
    </Dialog>
  );
}

const inputClass = "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500";
const primaryClass = "rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800";
const secondaryClass = "rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
