"use client";

import Link from "next/link";
import { MasterEditable } from "@/components/admin/MasterEditable";
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
import type { QuestionRow } from "@/lib/types/database";

type Props = {
  lang: string;
  question: QuestionRow;
};

export function PostCard({ lang, question }: Props) {
  const catSeg = categorySlugForUrl(question.category);
  const href = `/${lang}/${question.region}/${catSeg}/${question.slug}`;
  const categoryDisplay = categoryLabelForLang(question.category, lang);
  const dateStr = formatPostDate(question.created_at, lang);
  const hasImage = Boolean(question.image_url?.trim());
  const isHidden = question.is_hidden;

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-lg border shadow-sm transition hover:shadow-md ${
        isHidden
          ? "border-violet-200/80 bg-violet-50/95 hover:border-violet-300/90"
          : "border-zinc-200 bg-white hover:border-brand/30"
      }`}
    >
      <MasterEditable
        entity="question"
        id={question.id}
        field="image_url"
        fieldType="image"
        label="Kart görseli"
        initialValue={question.image_url ?? ""}
        storageSlug={question.slug}
        hasMedia={hasImage}
        wrapClassName={isHidden ? "bg-violet-100/35" : ""}
      >
        <Link
          href={href}
          className={`relative block aspect-[16/10] w-full ${
            isHidden ? "bg-violet-100/50" : "bg-zinc-100"
          }`}
        >
          {hasImage ? (
            <SafeImage
              fill
              src={question.image_url}
              className="object-cover"
              sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
              fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand/20 to-category/20">
                  <span className="font-serif text-2xl font-bold text-brand/40">
                    {(categoryDisplay || "?").slice(0, 1).toUpperCase()}
                  </span>
                </div>
              }
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/20 to-category/20">
              <span className="font-serif text-2xl font-bold text-brand/40">
                {(categoryDisplay || "?").slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
        </Link>
      </MasterEditable>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {isHidden ? (
          <p
            className="mb-3 rounded-md bg-violet-200/70 px-2.5 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-violet-950"
            role="status"
          >
            {lang === "tr" ? "Gizli — ziyaretçilere kapalı" : "Hidden — not public"}
          </p>
        ) : null}
        <div className="text-center">
          <MasterEditable
            entity="question"
            id={question.id}
            field="category"
            fieldType="text"
            label="Kategori (veritabanı)"
            initialValue={question.category}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-category">
              {categoryDisplay}
            </p>
          </MasterEditable>
        </div>
        <MasterEditable
          entity="question"
          id={question.id}
          field="title"
          fieldType="text"
          label="Başlık"
          initialValue={question.title}
          wrapClassName="mt-2"
          showQuestionVisibilityToggle
          questionIsHidden={question.is_hidden}
        >
          <Link href={href}>
            <h2 className="font-serif text-lg font-bold leading-snug text-zinc-900 transition hover:text-brand sm:text-xl">
              {question.title}
            </h2>
          </Link>
        </MasterEditable>
        <MasterEditable
          entity="question"
          id={question.id}
          field="author"
          fieldType="text"
          label="Yazar"
          initialValue={question.author}
          wrapClassName="mt-2"
        >
          <p className="text-xs text-zinc-500">
            {lang === "tr" ? "Yazar:" : "by"}{" "}
            <span className="text-zinc-700">{question.author}</span>
            {dateStr ? (
              <>
                {" "}
                | {dateStr}
              </>
            ) : null}
          </p>
        </MasterEditable>
        <MasterEditable
          entity="question"
          id={question.id}
          field="excerpt"
          fieldType="textarea"
          label="Özet (kartta özet yoksa tam metin önizlemesi gösterilir)"
          initialValue={question.excerpt ?? ""}
          wrapClassName="mt-3 flex-1"
        >
          {question.excerpt?.trim() ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">
              {stripQuickAnswerPrefix(question.excerpt)}
            </p>
          ) : (
            <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">
              {stripLeadingQuickAnswerBlockFromMarkdown(question.content)}
            </p>
          )}
        </MasterEditable>
        <Link
          href={href}
          className="mt-3 inline-block text-sm font-semibold text-brand hover:underline"
        >
          {lang === "tr" ? "Devamını oku →" : "Read more →"}
        </Link>
      </div>
    </article>
  );
}
