/**
 * `server-only` kullanılmıyor: `tsx` ile çalışan toplu çeviri betiği de bu modülü import eder.
 * Yalnızca Server Actions / sunucu kodu veya CLI’dan kullanın.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { categorySlugForUrl } from "@/lib/data/question-categories";
import { rewriteMarkdownLocalePaths } from "@/lib/format/rewrite-locale-in-markdown";
import { translateQuestionFieldsTrToEn } from "@/lib/server/translate-question-openai";
import type { QuestionRow } from "@/lib/types/database";

export type UpsertEnglishResult = {
  ok: boolean;
  message?: string;
  enPath?: string;
};

/**
 * Tek bir TR makale satırından İngilizce satırı üretir ve upsert eder (auth / revalidate yok).
 */
export async function upsertEnglishFromTurkishQuestion(
  db: SupabaseClient,
  q: QuestionRow,
  siteOrigin: string
): Promise<UpsertEnglishResult> {
  if (q.lang !== "tr") {
    return { ok: false, message: "Kaynak dil tr olmalı." };
  }

  let translated;
  try {
    translated = await translateQuestionFieldsTrToEn({
      title: q.title,
      excerpt: q.excerpt,
      content: q.content,
      media_seo_text: q.media_seo_text,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Çeviri başarısız.";
    return { ok: false, message: msg };
  }

  const enContent = rewriteMarkdownLocalePaths(
    translated.content,
    siteOrigin,
    "tr",
    "en"
  );
  const enExcerpt = translated.excerpt
    ? rewriteMarkdownLocalePaths(translated.excerpt, siteOrigin, "tr", "en")
    : null;
  const enMedia = translated.media_seo_text
    ? rewriteMarkdownLocalePaths(
        translated.media_seo_text,
        siteOrigin,
        "tr",
        "en"
      )
    : null;

  const enRow = {
    lang: "en" as const,
    category: q.category,
    slug: q.slug,
    title: translated.title,
    content: enContent,
    excerpt: enExcerpt,
    author: q.author,
    image_url: q.image_url,
    extra_images: q.extra_images,
    media_seo_text: enMedia,
    region: q.region,
    related_slugs: q.related_slugs,
    is_hidden: q.is_hidden,
  };

  const { error: upErr } = await db.from("questions").upsert(enRow, {
    onConflict: "lang,region,category,slug",
  });

  if (upErr) {
    return { ok: false, message: upErr.message || "Kayıt hatası." };
  }

  const catSeg = categorySlugForUrl(q.category);
  const enPath = `/en/${q.region}/${catSeg}/${q.slug}`;

  return { ok: true, message: "İngilizce sürüm kaydedildi.", enPath };
}
