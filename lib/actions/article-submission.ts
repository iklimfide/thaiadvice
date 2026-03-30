"use server";

import { isKnownQuestionCategorySlug } from "@/lib/data/question-categories";
import { getSupabaseOrNull } from "@/lib/supabase/server";
import { getSupabaseServiceRole } from "@/lib/supabase/service";

export type FormState = { ok: boolean; message?: string };

function sanitize(s: string, max = 20000) {
  return s.trim().slice(0, max);
}

export async function submitArticleSuggestion(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const author_alias = sanitize(String(formData.get("author_alias") ?? ""), 120);
  const category = sanitize(String(formData.get("category") ?? ""), 120);
  const title = sanitize(String(formData.get("title") ?? ""), 200);
  const content = sanitize(String(formData.get("content") ?? ""));
  const image_urlRaw = sanitize(String(formData.get("image_url") ?? ""), 2000);

  if (!author_alias || !category || !title || !content) {
    return { ok: false, message: "Lütfen zorunlu alanları doldurun." };
  }

  if (!isKnownQuestionCategorySlug(category)) {
    return { ok: false, message: "Geçersiz kategori seçimi." };
  }

  const db =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().length
      ? getSupabaseServiceRole()
      : getSupabaseOrNull();

  if (!db) {
    return {
      ok: false,
      message:
        "Sunucu yapılandırması eksik (Supabase ortam değişkenleri).",
    };
  }

  const { error } = await db.from("article_submissions").insert({
    title,
    category,
    content,
    author_alias,
    image_url: image_urlRaw || null,
    status: "pending",
  });

  if (error) {
    return {
      ok: false,
      message:
        "Kayıt sırasında hata oluştu. RLS veya tablo sütunlarını kontrol edin.",
    };
  }

  return { ok: true, message: "Teşekkürler; öneriniz alındı." };
}
