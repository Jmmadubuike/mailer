"use client";

import { useState } from "react";

export function UnsubscribeClient({
  token,
  email,
  valid,
}: {
  token: string;
  email: string | null;
  valid: boolean;
}) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setError(null);
    const response = await fetch("/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setError(body?.error ?? "Something went wrong");
      return;
    }
    setDone(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        {!valid ? (
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Invalid unsubscribe link
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              This link is expired or malformed. Contact the sender if you
              believe you received this in error.
            </p>
          </div>
        ) : done ? (
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              You have been unsubscribed
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {email} will no longer receive marketing emails from us.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Unsubscribe
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Confirm that you want to unsubscribe{" "}
              <span className="font-medium text-slate-700">{email}</span> from
              all marketing emails.
            </p>
            {error && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={confirm}
              className="mt-4 w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Unsubscribe from all marketing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
