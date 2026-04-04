"use client";

import {
  masterSetQuestionExtraImages,
  uploadQuestionExtraImageFile,
  type MasterInlineState,
} from "@/lib/actions/master-inline";
import { ARTICLE_EXTRA_IMAGES_MAX } from "@/lib/data/article-extra-images";
import { ArticleExtraImages } from "@/components/content/ArticleExtraImages";
import type { ArticleExtraImage } from "@/lib/types/database";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useMaster } from "./MasterContext";

type Row = { url: string; alt: string };

type Props = {
  questionId: string;
  slug: string;
  lang: string;
  pathname: string;
  initialImages: ArticleExtraImage[];
};

const initialInline: MasterInlineState = { ok: true };

function rowsFromInitial(images: ArticleExtraImage[]): Row[] {
  return images.map((i) => ({ url: i.url, alt: i.alt ?? "" }));
}

export function MasterArticleExtraImages({
  questionId,
  slug,
  lang,
  pathname,
  initialImages,
}: Props) {
  const { isMaster } = useMaster();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => rowsFromInitial(initialImages));
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  useEffect(() => {
    setRows(rowsFromInitial(initialImages));
  }, [initialImages]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const hasPublicImages = rows.some((r) => r.url.trim());
  if (!isMaster && !hasPublicImages) return null;

  const btnClass =
    "shrink-0 rounded border border-amber-300 bg-amber-100/80 px-2 py-0.5 text-xs font-medium text-amber-950 hover:bg-amber-200/90";

  async function onFileAt(index: number, file: File | undefined) {
    if (!file) return;
    const fd = new FormData();
    fd.set("id", questionId);
    fd.set("slug", slug);
    fd.set("file", file);
    const res = await uploadQuestionExtraImageFile(fd);
    if (res.ok && res.url) {
      setRows((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], url: res.url! };
        return next;
      });
      setFeedback(
        res.message
          ? { ok: true, text: res.message }
          : null
      );
    } else {
      setFeedback({ ok: false, text: res.message ?? "Yükleme başarısız." });
    }
  }

  function save() {
    setFeedback(null);
    const items = rows
      .filter((r) => r.url.trim())
      .map((r) => ({
        url: r.url.trim(),
        ...(r.alt.trim() ? { alt: r.alt.trim() } : {}),
      }))
      .slice(0, ARTICLE_EXTRA_IMAGES_MAX);

    const fd = new FormData();
    fd.set("id", questionId);
    fd.set("pathname", pathname);
    fd.set("lang", lang);
    fd.set("storage_slug", slug);
    fd.set("value", JSON.stringify(items));

    startTransition(async () => {
      const res = await masterSetQuestionExtraImages(initialInline, fd);
      setFeedback({
        ok: res.ok,
        text: res.message ?? (res.ok ? "Kaydedildi." : "Kayıt başarısız."),
      });
      if (res.ok) {
        router.refresh();
        setOpen(false);
      }
    });
  }

  return (
    <div className="mt-6 w-full max-w-3xl sm:mt-8">
      {isMaster ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button type="button" className={btnClass} onClick={() => setOpen(true)}>
            {lang === "tr" ? "Ek görselleri düzenle" : "Edit extra images"}
          </button>
          {feedback ? (
            <span
              className={
                feedback.ok ? "text-xs text-emerald-700" : "text-xs text-red-600"
              }
            >
              {feedback.text}
            </span>
          ) : null}
        </div>
      ) : null}

      <ArticleExtraImages
        images={rows
          .filter((r) => r.url.trim())
          .map((r) => ({
            url: r.url.trim(),
            ...(r.alt.trim() ? { alt: r.alt.trim() } : {}),
          }))}
        lang={lang}
      />

      {open ? (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-labelledby="master-extra-images-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2
              id="master-extra-images-title"
              className="text-lg font-semibold text-zinc-900"
            >
              {lang === "tr" ? "Ek görseller" : "Extra images"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {lang === "tr"
                ? `En fazla ${ARTICLE_EXTRA_IMAGES_MAX} görsel. Kapak görseli burada değil; yalnızca metin sonrası galeri.`
                : `Up to ${ARTICLE_EXTRA_IMAGES_MAX} images. Cover is edited separately.`}
            </p>

            <div className="mt-4 space-y-4">
              {rows.map((row, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-200 bg-zinc-50/80 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs font-medium text-zinc-700">
                      {lang === "tr" ? "Dosya" : "File"}
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="max-w-[200px] text-xs"
                      onChange={(e) => {
                        void onFileAt(index, e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  <label className="mt-2 block text-xs font-medium text-zinc-700">
                    URL
                  </label>
                  <input
                    type="url"
                    value={row.url}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRows((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], url: v };
                        return next;
                      });
                    }}
                    className="mt-0.5 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                    placeholder="https://..."
                  />
                  <label className="mt-2 block text-xs font-medium text-zinc-700">
                    {lang === "tr" ? "Alt metin (isteğe bağlı)" : "Alt text (optional)"}
                  </label>
                  <input
                    type="text"
                    value={row.alt}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRows((prev) => {
                        const next = [...prev];
                        next[index] = { ...next[index], alt: v };
                        return next;
                      });
                    }}
                    className="mt-0.5 w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    className="mt-2 text-xs font-medium text-red-700 hover:underline"
                    onClick={() => {
                      setRows((prev) => prev.filter((_, i) => i !== index));
                    }}
                  >
                    {lang === "tr" ? "Bu satırı kaldır" : "Remove row"}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                onClick={() => {
                  if (rows.length >= ARTICLE_EXTRA_IMAGES_MAX) return;
                  setRows((prev) => [...prev, { url: "", alt: "" }]);
                }}
                disabled={rows.length >= ARTICLE_EXTRA_IMAGES_MAX}
              >
                {lang === "tr" ? "Satır ekle" : "Add row"}
              </button>
              <button
                type="button"
                className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                onClick={() => save()}
                disabled={pending}
              >
                {pending
                  ? lang === "tr"
                    ? "Kaydediliyor…"
                    : "Saving…"
                  : lang === "tr"
                    ? "Kaydet"
                    : "Save"}
              </button>
              <button
                type="button"
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
                onClick={() => setOpen(false)}
              >
                {lang === "tr" ? "İptal" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
