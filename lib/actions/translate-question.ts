"use server";

import { revalidatePath } from "next/cache";
import { getMasterUser } from "@/lib/admin/auth-server";
import { mapQuestionRow } from "@/lib/data/map-rows";
import { categorySlugForUrl } from "@/lib/data/question-categories";
import { rewriteMarkdownLocalePaths } from "@/lib/format/rewrite-locale-in-markdown";
import { getPublicSiteUrl } from "@/lib/metadata/site";
import { translateQuestionFieldsTrToEn } from "@/lib/server/translate-question-openai";
import { getSupabaseServiceRole } from "@/lib/supabase/service";
import type { SiteLang } from "@/lib/seo/site-languages";

export type TranslateQuestionState = {
  ok: boolean;
  message?: string;
  enPath?: string;
};

export async function translateQuestionToEnglish(
  questionId: string,
  pathname: string
): Promise<TranslateQuestionState> {
  const user = await getMasterUser();
  if (!user) {
    return { ok: false, message: "Yetkisiz." };
  }

  const id = questionId.trim();
  if (!id) return { ok: false, message: "Geçersiz makale." };

  const db = getSupabaseServiceRole();
  const { data: row, error: fetchErr } = await db
    .from("questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, message: "Makale bulunamadı." };
  }

  const q = mapQuestionRow(row);

  if (q.lang !== "tr") {
    return {
      ok: false,
      message: "Yalnızca Türkçe (tr) makalelerden İngilizce üretilir.",
    };
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

  const siteOrigin = getPublicSiteUrl();
  const catSeg = categorySlugForUrl(q.category);
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

  const enPath = `/en/${q.region}/${catSeg}/${q.slug}`;
  revalidatePath(pathname);
  revalidatePath(enPath);
  revalidatePath("/en");
  revalidatePath("/tr");

  return {
    ok: true,
    message: "İngilizce sürüm kaydedildi.",
    enPath,
  };
}

/** İleride: targetLang parametresi ile genişletmek için iskelet */
export async function translateQuestionToLang(
  questionId: string,
  pathname: string,
  targetLang: SiteLang
): Promise<TranslateQuestionState> {
  if (targetLang === "en") {
    return translateQuestionToEnglish(questionId, pathname);
  }
  return { ok: false, message: "Bu dil henüz desteklenmiyor." };
}
