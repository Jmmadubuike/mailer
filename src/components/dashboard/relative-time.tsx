"use client";

import { useEffect, useState } from "react";

export function RelativeTime({ date }: { date: string }) {
  const [label, setLabel] = useState(() => formatRelative(date));

  useEffect(() => {
    const timer = setInterval(() => setLabel(formatRelative(date)), 60_000);
    return () => clearInterval(timer);
  }, [date]);

  return <time dateTime={date}>{label}</time>;
}

function formatRelative(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
