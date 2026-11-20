"use client";

import { useState } from "react";
import Link from "next/link";
import { PasswordInput } from "@/components/ui/password-input";

export function ResetForm({ token }: { token: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function requestReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (response.ok) {
      setMessage("If that address exists, a reset link has been sent.");
    }
  }

  async function submitNewPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setError(body?.error ?? "Reset failed");
      return;
    }
    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        {token ? (
          done ? (
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Password updated</h1>
              <p className="mt-2 text-sm text-slate-500">You can now sign in with your new password.</p>
              <Link href="/login" className="mt-4 inline-block text-sm font-medium text-slate-700 hover:underline">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={submitNewPassword} className="space-y-4">
              <h1 className="text-xl font-semibold text-slate-900">Set a new password</h1>
              <PasswordInput
                required
                minLength={8}
                value={password}
                onChange={setPassword}
                placeholder="New password"
                autoComplete="new-password"
              />
              {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button type="submit" className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                Update password
              </button>
            </form>
          )
        ) : (
          <form onSubmit={requestReset} className="space-y-4">
            <h1 className="text-xl font-semibold text-slate-900">Reset password</h1>
            <p className="text-sm text-slate-500">Enter your email and we&apos;ll send a reset link.</p>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500" />
            {message && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
            <button type="submit" className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
              Send reset link
            </button>
            <p className="text-center text-sm text-slate-500">
              <Link href="/login" className="hover:text-slate-700">Back to sign in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
