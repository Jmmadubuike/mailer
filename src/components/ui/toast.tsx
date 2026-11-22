"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

export function Toast({
  message,
  tone = "default",
  onDismiss,
}: {
  message: string | null;
  tone?: "default" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={cn(
        "fixed bottom-6 right-6 z-[60] rounded-md px-4 py-3 text-sm font-medium text-white shadow-lg",
        tone === "error" ? "bg-red-600" : "bg-slate-900",
      )}
    >
      {message}
    </div>
  );
}
