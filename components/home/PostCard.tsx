"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MasterEditable } from "@/components/admin/MasterEditable";
import { useMaster } from "@/components/admin/MasterContext";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  categoryLabelForLang,
  categorySlugForUrl,
} from "@/lib/data/question-categories";
import { formatPostDate } from "@/lib/format/date";
import {
  stripLeadingQuickAnswerBlockFromMarkdown,
  stripQuickAnswerPrefix,
} from "@/lib/format/faq-display";
import { translateQuestionToEnglish } from "@/lib/actions/translate-question";
import type { QuestionRow } from "@/lib/types/database";
import { useState, useTransition } from "react";

type Props = {
  lang: string;
  question: QuestionRow;
  /** Master TR listelerinde: EN çeviri satırı yoksa true */
  missingEnglishTranslation?: boolean;
};

export function PostCard({ lang, question, missingEnglishTranslation }: Props) {
  const { isMaster } = useMaster();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);
  const catSeg = categorySlugForUrl(question.category);
  const href = `/${lang}/${question.region}/${catSeg}/${question.slug}`;
  const categoryDisplay = categoryLabelForLang(question.category, lang);
  const dateStr = formatPostDate(question.created_at, lang);
  const updatedStr = formatPostDate(question.updated_at, lang);
  const createdMs = new Date(question.created_at).getTime();
  const updatedMs = new Date(question.updated_at).getTime();
  const showUpdatedAt =
    Number.isFinite(createdMs) &&
    Number.isFinite(updatedMs) &&
    updatedMs > createdMs &&
    Boolean(updatedStr) &&
    updatedStr !== dateStr;
  const hasImage = Boolean(question.image_url?.trim());
  const isHidden = question.is_hidden;
  const isScheduled =
    Number.isFinite(createdMs) && createdMs > Date.now();
  const tr = lang === "tr";

  const shellClass =
    isHidden
      ? "rounded-[2rem] border border-violet-200/90 bg-violet-50/95 p-5 shadow-sm"
      : isScheduled
        ? "rounded-[2rem] border border-amber-200/90 bg-amber-50/40 p-5 shadow-sm"
        : "rounded-[2rem] border border-slate-100 bg-white p-5 shadow-sm";

  return (
    <article className={`${shellClass} overflow-hidden transition hover:shadow-md`}>
      {isHidden ? (
        <p
          className="mb-4 rounded-xl bg-violet-200/70 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-violet-950"
          role="status"
        >
          {tr ? "Gizli — ziyaretçilere kapalı" : "Hidden — not public"}
        </p>
      ) : null}
      {!isHidden && isScheduled ? (
        <p
          className="mb-4 rounded-xl bg-amber-200/70 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-amber-950"
          role="status"
        >
          {tr
            ? "Zamanlandı — yayın tarihinde herkese açılır"
            : "Scheduled — goes public on date shown"}
          {tr && isMaster && missingEnglishTranslation ? (
            <span className="mt-1 block font-semibold normal-case tracking-normal text-red-700">
              Makalenin çevirisi henüz yapılmadı.{" "}
              <button
                type="button"
                disabled={pending}
                className="ml-1 inline-flex items-center rounded-md border border-red-300/80 bg-white/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-800 hover:bg-white disabled:opacity-60"
                onClick={() => {
                  setTranslateError(null);
                  startTransition(async () => {
                    const r = await translateQuestionToEnglish(question.id, href);
                    if (r.ok && r.enPath) {
                      router.push(r.enPath);
                      router.refresh();
                    } else {
                      setTranslateError(r.message ?? "Çeviri başarısız.");
                    }
                  });
                }}
              >
                {pending ? "Çevriliyor…" : "Çevir"}
              </button>
            </span>
          ) : null}
        </p>
      ) : null}
      {tr && isMaster && translateError ? (
        <p className="mb-4 rounded-lg bg-red-100/90 px-3 py-2 text-center text-[11px] font-semibold text-red-900">
          {translateError}
        </p>
      ) : null}

      <MasterEditable
        entity="question"
        id={question.id}
        field="category"
        fieldType="text"
        label="Kategori (veritabanı)"
        initialValue={question.category}
        wrapClassName="mb-4 min-w-0"
      >
        <span className="block text-[10px] font-bold uppercase tracking-widest text-category">
          {categoryDisplay}
        </span>
      </MasterEditable>

      <MasterEditable
        entity="question"
        id={question.id}
        field="title"
        fieldType="text"
        label="Başlık"
        initialValue={question.title}
        wrapClassName="mb-16"
        showQuestionVisibilityToggle
        questionIsHidden={question.is_hidden}
      >
        <Link href={href}>
          <h2 className="font-sans text-xl font-extrabold leading-tight tracking-tight text-slate-900 transition hover:text-brand">
            {question.title}
          </h2>
        </Link>
      </MasterEditable>

      <MasterEditable
        entity="question"
        id={question.id}
        field="image_url"
        fieldType="image"
        label="Kart görseli"
        initialValue={question.image_url ?? ""}
        storageSlug={question.slug}
        hasMedia={hasImage}
        wrapClassName={`mb-8 ${isHidden ? "bg-violet-100/30" : ""}`}
      >
        <Link
          href={href}
          className={`relative block aspect-video w-full overflow-hidden rounded-2xl shadow-inner ${
            isHidden ? "bg-violet-100/50" : "bg-slate-100"
          }`}
        >
          {hasImage ? (
            <SafeImage
              fill
              src={question.image_url}
              className="object-cover"
              sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
              fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand/15 to-category/15">
                  <span className="font-sans text-2xl font-extrabold text-brand/35">
                    {(categoryDisplay || "?").slice(0, 1).toUpperCase()}
                  </span>
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/15 to-category/15">
              <span className="font-sans text-2xl font-extrabold text-brand/35">
                {(categoryDisplay || "?").slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
        </Link>
      </MasterEditable>

      <div className="mb-4 flex flex-col gap-2">
        <MasterEditable
          entity="question"
          id={question.id}
          field="author"
          fieldType="text"
          label="Yazar"
          initialValue={question.author}
          wrapClassName="min-w-0"
        >
          <p className="font-sans leading-snug">
            <span className="mr-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              {tr ? "Yazar" : "By"}
            </span>
            <span className="text-lg font-extrabold tracking-tight text-brand">
              {question.author}
            </span>
          </p>
        </MasterEditable>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500">
          <span className="text-slate-400">{tr ? "Yayın:" : "Published:"}</span>
          {dateStr ? (
            <MasterEditable
              entity="question"
              id={question.id}
              field="created_at"
              fieldType="datetime_local"
              label="Yayın tarihi"
              initialValue={question.created_at}
              wrapClassName="min-w-0"
            >
              <span>{dateStr}</span>
            </MasterEditable>
          ) : (
            <MasterEditable
              entity="question"
              id={question.id}
              field="created_at"
              fieldType="datetime_local"
              label="Yayın tarihi"
              initialValue={question.created_at}
              wrapClassName="min-w-0"
            >
              <span className="text-slate-300">
                {tr ? "(tarih yok)" : "(no date)"}
              </span>
            </MasterEditable>
          )}
          {showUpdatedAt && updatedStr ? (
            <>
              <span aria-hidden className="text-slate-300">
                •
              </span>
              <span className="text-slate-400">
                {tr ? "Güncelleme:" : "Updated:"}
              </span>
              <span>{updatedStr}</span>
            </>
          ) : null}
        </div>
      </div>

      <MasterEditable
        entity="question"
        id={question.id}
        field="excerpt"
        fieldType="textarea"
        label="Özet (kartta özet yoksa tam metin önizlemesi gösterilir)"
        initialValue={question.excerpt ?? ""}
        wrapClassName="mb-4"
      >
        {question.excerpt?.trim() ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
            {stripQuickAnswerPrefix(question.excerpt)}
          </p>
        ) : (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
            {stripLeadingQuickAnswerBlockFromMarkdown(question.content)}
          </p>
        )}
      </MasterEditable>

      <Link
        href={href}
        className="group/link inline-flex items-center text-sm font-bold text-brand hover:gap-2"
      >
        {tr ? "Devamını oku" : "Read more"}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          className="ml-2 h-3 w-3 transition-transform group-hover/link:translate-x-0.5"
          aria-hidden
        >
          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </article>
  );
}
