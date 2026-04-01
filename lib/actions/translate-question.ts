"use server";

import { revalidatePath } from "next/cache";
import { getMasterUser } from "@/lib/admin/auth-server";
import { mapQuestionRow } from "@/lib/data/map-rows";
import { categorySlugForUrl } from "@/lib/data/question-categories";
import { rewriteMarkdownLocalePaths } from "@/lib/format/rewrite-locale-in-markdown";
import { getPublicSiteUrl } from "@/lib/metadata/site";
import { upsertEnglishFromTurkishQuestion } from "@/lib/server/upsert-english-from-turkish-question";
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

  const siteOrigin = getPublicSiteUrl();
  const result = await upsertEnglishFromTurkishQuestion(db, q, siteOrigin);
  if (!result.ok || !result.enPath) {
    return {
      ok: false,
      message: result.message ?? "Çeviri veya kayıt başarısız.",
    };
  }

  const enPath = result.enPath;
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

/**
 * OpenAI çağırmadan, mevcut EN satırındaki iç linkleri /tr/ → /en/ yeniden yazar.
 * Eski çevirilerde kalan linkler veya www / host uyumsuzluğu sonrası 404 onarımı için.
 */
export async function repairEnglishInternalLinks(
  trQuestionId: string,
  pathname: string
): Promise<TranslateQuestionState> {
  const user = await getMasterUser();
  if (!user) {
    return { ok: false, message: "Yetkisiz." };
  }

  const id = trQuestionId.trim();
  if (!id) return { ok: false, message: "Geçersiz makale." };

  const db = getSupabaseServiceRole();
  const { data: trRaw, error: trErr } = await db
    .from("questions")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (trErr || !trRaw) {
    return { ok: false, message: "Makale bulunamadı." };
  }

  const q = mapQuestionRow(trRaw);
  if (q.lang !== "tr") {
    return { ok: false, message: "Yalnızca Türkçe makale kimliği kullanılabilir." };
  }

  const { data: enRaw, error: enErr } = await db
    .from("questions")
    .select("*")
    .eq("lang", "en")
    .eq("region", q.region)
    .eq("category", q.category)
    .eq("slug", q.slug)
    .maybeSingle();

  if (enErr || !enRaw) {
    return { ok: false, message: "İngilizce sürüm bulunamadı; önce çeviri yapın." };
  }

  const en = mapQuestionRow(enRaw);
  const siteOrigin = getPublicSiteUrl();
  const catSeg = categorySlugForUrl(q.category);
  const enPath = `/en/${q.region}/${catSeg}/${q.slug}`;

  const content = rewriteMarkdownLocalePaths(
    en.content,
    siteOrigin,
    "tr",
    "en"
  );
  const excerpt = en.excerpt
    ? rewriteMarkdownLocalePaths(en.excerpt, siteOrigin, "tr", "en")
    : null;
  const media_seo_text = en.media_seo_text
    ? rewriteMarkdownLocalePaths(en.media_seo_text, siteOrigin, "tr", "en")
    : null;

  const { error: upErr } = await db
    .from("questions")
    .update({
      content,
      excerpt,
      media_seo_text,
      updated_at: new Date().toISOString(),
    })
    .eq("id", en.id);

  if (upErr) {
    return { ok: false, message: upErr.message || "Kayıt hatası." };
  }

  revalidatePath(pathname);
  revalidatePath(enPath);
  revalidatePath("/en");
  revalidatePath("/tr");

  return {
    ok: true,
    message: "İngilizce iç linkler güncellendi (/tr/ → /en/).",
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
