"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { useMaster } from "@/components/admin/MasterContext";
import {
  repairEnglishInternalLinks,
  translateQuestionToEnglish,
} from "@/lib/actions/translate-question";

type Props = {
  questionId: string;
  lang: string;
  pathname: string;
  /** Veritabanında aynı makale için lang=en kaydı var */
  hasEnglishTranslation?: boolean;
};

export function MasterTranslateBar({
  questionId,
  lang,
  pathname,
  hasEnglishTranslation = false,
}: Props) {
  const { isMaster } = useMaster();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!isMaster || lang !== "tr") return null;

  return (
    <div className="mb-6 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm">
      <p className="mb-2 font-semibold">Master: çeviri</p>
      <p className="mb-3 text-xs leading-relaxed text-amber-900/85">
        Türkçe makaleyi OpenAI ile İngilizceye çevirir; aynı slug / bölge / kategori ile{" "}
        <code className="rounded bg-white/80 px-1">lang=en</code> satırı oluşturur veya
        günceller. Sitedeki <code className="rounded bg-white/80 px-1">/tr/</code> iç
        linkleri aynı path ile <code className="rounded bg-white/80 px-1">/en/</code>
        yapar (yalnızca bu site adresi ve göreli bağlantılar).
      </p>
      {hasEnglishTranslation ? (
        <p className="mb-3 rounded-md border border-amber-300/80 bg-white/60 px-2.5 py-2 text-xs leading-relaxed text-amber-950">
          Bu makalenin İngilizce sürümü zaten var. Tekrar çevirirsen mevcut EN metni
          güncel Türkçe içerikten yeniden üretilir ve üzerine yazılır; EN sayfada yaptığın
          elle düzeltmeler kaybolur.
        </p>
      ) : null}
      {error ? (
        <p className="mb-2 rounded-md bg-red-100/90 px-2 py-1.5 text-xs text-red-900">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          className="rounded-lg bg-amber-800 px-3 py-2 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-amber-900 disabled:opacity-50"
          onClick={() => {
            setError(null);
            if (hasEnglishTranslation) {
              const ok = window.confirm(
                "Bu makale daha önce İngilizceye çevrilmiş. Tekrar çeviri yapmak, mevcut İngilizce sürümünü silip güncel Türkçe metinden yeniden oluşturur (EN’deki elle düzeltmeler gider). Devam etmek istiyor musunuz?"
              );
              if (!ok) return;
            }
            startTransition(async () => {
              const r = await translateQuestionToEnglish(questionId, pathname);
              if (r.ok && r.enPath) {
                router.push(r.enPath);
                router.refresh();
              } else {
                setError(r.message ?? "Bilinmeyen hata.");
              }
            });
          }}
        >
          {pending ? "Çevriliyor…" : "İngilizceye çevir (AI)"}
        </button>
        {hasEnglishTranslation ? (
          <button
            type="button"
            disabled={pending}
            className="rounded-lg border border-amber-700/50 bg-white/90 px-3 py-2 text-xs font-bold uppercase tracking-wide text-amber-950 transition hover:bg-white disabled:opacity-50"
            title="OpenAI çağırmaz; yalnızca /tr/ iç linklerini /en/ yapar"
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const r = await repairEnglishInternalLinks(questionId, pathname);
                if (r.ok) {
                  router.refresh();
                } else {
                  setError(r.message ?? "Bilinmeyen hata.");
                }
              });
            }}
          >
            EN iç linklerini düzelt
          </button>
        ) : null}
      </div>
    </div>
  );
}
