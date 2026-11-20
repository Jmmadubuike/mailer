"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";

type Mode = "visual" | "html" | "preview";

export function EmailComposer({
  initialHtml,
  onChange,
  previewTransform,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  previewTransform?: (html: string) => string;
}) {
  const [mode, setMode] = useState<Mode>("visual");
  const [html, setHtml] = useState(initialHtml);

  function update(value: string) {
    setHtml(value);
    onChange(value);
  }

  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(value)}
      className={`rounded-md px-3 py-1 text-sm ${mode === value ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-2 flex gap-2">
        {tab("visual", "Visual")}
        {tab("html", "HTML")}
        {tab("preview", "Preview")}
      </div>

      {mode === "visual" && (
        <RichTextEditor initialHtml={html} onChange={update} />
      )}

      {mode === "html" && (
        <textarea
          value={html}
          onChange={(event) => update(event.target.value)}
          rows={14}
          className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-indigo-500"
        />
      )}

      {mode === "preview" && (
        <iframe
          title="Email preview"
          sandbox=""
          srcDoc={previewTransform ? previewTransform(html) : html}
          className="min-h-[320px] w-full rounded-md border border-slate-200 bg-white"
        />
      )}
    </div>
  );
}
