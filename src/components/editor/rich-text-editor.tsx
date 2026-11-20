"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { cn } from "@/lib/utils";

export function RichTextEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: true,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TextStyle,
      Color,
      Highlight,
    ],
    content: initialHtml || "<p></p>",
    onUpdate: ({ editor: current }) => onChange(current.getHTML()),
  });

  if (!editor) return null;

  const button = (active: boolean, onClick: () => void, children: React.ReactNode) => (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "rounded px-2 py-1 text-sm text-slate-600 hover:bg-slate-100",
        active && "bg-slate-200 text-slate-900",
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="rounded-md border border-slate-300">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        {button(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <strong>B</strong>)}
        {button(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <em>I</em>)}
        {button(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <u>U</u>)}
        {button(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), <s>S</s>)}
        {button(editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), "H1")}
        {button(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "H2")}
        {button(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "• List")}
        {button(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "1. List")}
        {button(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "Quote")}
        {button(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), "Code")}
        {button(editor.isActive("highlight"), () => editor.chain().focus().toggleHighlight().run(), "Mark")}
        {button(editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), "←")}
        {button(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), "↔")}
        {button(editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), "→")}
        {button(editor.isActive("link"), () => {
          const url = window.prompt("Link URL");
          if (url) editor.chain().focus().setLink({ href: url }).run();
        }, "Link")}
        {button(false, () => {
          const url = window.prompt("Image URL");
          if (url) editor.chain().focus().setImage({ src: url }).run();
        }, "Image")}
        <input
          type="color"
          onChange={(event) => editor.chain().focus().setColor(event.target.value).run()}
          className="h-6 w-8 cursor-pointer rounded border border-slate-300"
          title="Text color"
        />
      </div>
      <EditorContent
        editor={editor}
        className="prose-sm min-h-[240px] px-3 py-2 outline-none [&_.ProseMirror]:min-h-[240px] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
}
