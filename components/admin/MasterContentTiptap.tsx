"use client";

import type { Editor } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import TurndownService from "turndown";
import {
  searchInternalArticleLinks,
  type InternalLinkHit,
} from "@/lib/actions/internal-link-search";

marked.setOptions({ gfm: true, breaks: true });

type Props = {
  initialMarkdown: string;
  lang: string;
};

function syncMarkdownToTextarea(editor: Editor, td: TurndownService, ta: HTMLTextAreaElement) {
  ta.value = td.turndown(editor.getHTML());
}

/** Seçimden arama kutusu için kısa metin (kelime / ifade) */
function textFromSelection(editor: Editor, maxLen = 80): string {
  const { from, to } = editor.state.selection;
  if (from === to) return "";
  const raw = editor.state.doc.textBetween(from, to, " ").replace(/\s+/g, " ").trim();
  if (raw.length <= maxLen) return raw;
  return raw.slice(0, maxLen);
}

export function MasterContentTiptap({ initialMarkdown, lang }: Props) {
  const hiddenRef = useRef<HTMLTextAreaElement>(null);
  const turndownRef = useRef(
    new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    })
  );

  const [mounted, setMounted] = useState(false);
  const [toolsModalOpen, setToolsModalOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [hits, setHits] = useState<InternalLinkHit[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onSync = useCallback((editor: Editor) => {
    const ta = hiddenRef.current;
    if (!ta) return;
    syncMarkdownToTextarea(editor, turndownRef.current, ta);
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: "text-brand underline underline-offset-2",
          target: "_self",
          rel: "noopener",
        },
      }),
      Placeholder.configure({
        placeholder: "Makale gövdesi (kalın, başlık, liste, bağlantı…)",
      }),
    ],
    editorProps: {
      attributes: {
        class:
          "master-tiptap-editor min-h-[280px] rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-brand/30",
      },
    },
    content: (marked.parse(initialMarkdown || "") as string) || "<p></p>",
    onUpdate: ({ editor: ed }) => onSync(ed),
    onCreate: ({ editor: ed }) => onSync(ed),
  });

  useEffect(() => {
    if (searchQ.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      setSearching(true);
      void searchInternalArticleLinks(searchQ, lang).then((r) => {
        setHits(r);
        setSearching(false);
      });
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchQ, lang]);

  const openToolsModal = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().run();
    const sel = textFromSelection(editor);
    setSearchQ(sel.length >= 2 ? sel : "");
    setHits([]);
    const href = editor.getAttributes("link").href as string | undefined;
    setLinkHref(href ?? "");
    setToolsModalOpen(true);
  }, [editor]);

  const closeToolsModal = useCallback(() => {
    setToolsModalOpen(false);
  }, []);

  useEffect(() => {
    if (!toolsModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeToolsModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toolsModalOpen, closeToolsModal]);

  const applyLink = useCallback(() => {
    if (!editor || !linkHref.trim()) return;
    editor.chain().focus().setLink({ href: linkHref.trim() }).run();
  }, [editor, linkHref]);

  const removeLink = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setLinkHref("");
  }, [editor]);

  const pickHit = useCallback(
    (h: InternalLinkHit) => {
      setLinkHref(h.href);
      if (!editor) return;
      editor.chain().focus().setLink({ href: h.href }).run();
      setSearchQ("");
      setHits([]);
    },
    [editor]
  );

  const formatButtonWrap = "rounded px-2 py-1.5 text-xs font-medium transition";

  if (!editor) {
    return (
      <div className="min-h-[280px] rounded-md border border-zinc-200 bg-zinc-50 px-3 py-8 text-center text-sm text-zinc-500">
        Editör yükleniyor…
      </div>
    );
  }

  const formatToolbar = (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`${formatButtonWrap} ${
          editor.isActive("bold") ? "bg-zinc-900 text-white" : "bg-white text-zinc-800 ring-1 ring-zinc-200"
        }`}
      >
        Kalın
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`${formatButtonWrap} italic ${
          editor.isActive("italic") ? "bg-zinc-900 text-white" : "bg-white text-zinc-800 ring-1 ring-zinc-200"
        }`}
      >
        İtalik
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`${formatButtonWrap} underline ${
          editor.isActive("underline")
            ? "bg-zinc-900 text-white"
            : "bg-white text-zinc-800 ring-1 ring-zinc-200"
        }`}
      >
        Alt çizgi
      </button>
      <button
        type="button"
        onClick={openToolsModal}
        className={`${formatButtonWrap} ${
          editor.isActive("link") ? "bg-brand text-white" : "bg-violet-100 text-violet-950"
        }`}
      >
        Bağlantı
      </button>
    </div>
  );

  const toolsModal =
    mounted && toolsModalOpen
      ? createPortal(
          <div
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4"
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeToolsModal();
            }}
          >
            <div
              role="dialog"
              aria-labelledby="master-tiptap-tools-title"
              className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4 shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3
                  id="master-tiptap-tools-title"
                  className="text-base font-bold text-zinc-900"
                >
                  Biçim ve bağlantı
                </h3>
                <button
                  type="button"
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
                  onClick={closeToolsModal}
                >
                  Kapat
                </button>
              </div>
              <p className="mb-3 text-xs text-zinc-600">
                Site içi arama kutusu, modalı açarken seçtiğiniz metinle doldurulur (en az 2 karakter).
              </p>
              <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50/90 px-2 py-2">
                {formatToolbar}
              </div>
              <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
                <span className="text-xs font-semibold text-zinc-800">Bağlantı</span>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                  URL (göreli veya tam)
                </label>
                <input
                  type="text"
                  value={linkHref}
                  onChange={(e) => setLinkHref(e.target.value)}
                  placeholder="/tr/bölge/kategori/slug veya https://…"
                  className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs"
                />
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={applyLink}
                    className="rounded bg-zinc-900 px-2 py-1 text-xs text-white"
                  >
                    Uygula
                  </button>
                  <button
                    type="button"
                    onClick={removeLink}
                    className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-700"
                  >
                    Kaldır
                  </button>
                </div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                  Site içi ara ({lang})
                </label>
                <input
                  type="search"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Başlık veya slug…"
                  className="w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs"
                />
                {searching ? (
                  <p className="text-[10px] text-zinc-500">Aranıyor…</p>
                ) : hits.length > 0 ? (
                  <ul className="max-h-48 overflow-y-auto text-xs">
                    {hits.map((h) => (
                      <li key={h.href}>
                        <button
                          type="button"
                          onClick={() => pickHit(h)}
                          className="w-full rounded px-1 py-1.5 text-left hover:bg-violet-100"
                        >
                          <span className="line-clamp-2 font-medium text-zinc-800">{h.title}</span>
                          <span className="block truncate font-mono text-[10px] text-zinc-500">
                            {h.href}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : searchQ.trim().length >= 2 ? (
                  <p className="text-[10px] text-zinc-500">Sonuç yok.</p>
                ) : null}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  const floatButton =
    mounted
      ? createPortal(
          <button
            type="button"
            onClick={openToolsModal}
            className="fixed bottom-24 right-4 z-[125] max-w-[calc(100vw-2rem)] rounded-full border-2 border-violet-600 bg-violet-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-lg hover:bg-violet-700 sm:bottom-28 sm:right-6"
          >
            Biçim &amp; bağlantı
          </button>,
          document.body
        )
      : null;

  return (
    <div className="space-y-2">
      <textarea
        ref={hiddenRef}
        name="value"
        defaultValue={initialMarkdown}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        readOnly
      />

      <p className="text-xs leading-snug text-zinc-600">
        Uzun metinde üstte kalan araçlar için sağ alttaki{" "}
        <strong className="text-violet-800">Biçim &amp; bağlantı</strong> düğmesine basın; seçtiğiniz
        kelime site içi aramada otomatik dolar.
      </p>

      <BubbleMenu
        editor={editor}
        appendTo={() => document.body}
        className="z-[200]"
        options={{ placement: "top", strategy: "fixed" }}
        shouldShow={({ editor: ed }) => {
          if (!ed.isEditable) return false;
          if (ed.isActive("codeBlock")) return false;
          if (ed.isActive("link")) return true;
          return !ed.state.selection.empty;
        }}
      >
        <div className="flex flex-col gap-1 rounded-lg border border-zinc-300 bg-white p-1.5 shadow-xl ring-1 ring-black/5">
          {formatToolbar}
        </div>
      </BubbleMenu>

      <EditorContent editor={editor} />
      <p className="text-[10px] leading-relaxed text-zinc-500">
        En alttaki <strong>Kaydet</strong> ile kaydedilir (Markdown).
      </p>

      {floatButton}
      {toolsModal}
    </div>
  );
}
