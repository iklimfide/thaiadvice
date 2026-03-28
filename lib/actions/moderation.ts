"use server";

import { revalidatePath } from "next/cache";
import {
  questionHeroStorageObjectPath,
  slugSegmentForStorage,
} from "@/lib/data/storage-slug";
import { getMasterUser } from "@/lib/admin/auth-server";
import { ingestRemoteImageAsWebpToStorage } from "@/lib/server/ingest-remote-image";
import { bufferToWebp } from "@/lib/server/image-webp";
import { getSupabaseServiceRole } from "@/lib/supabase/service";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
const MAX_BYTES = 5 * 1024 * 1024;

function sanitize(s: string, max: number) {
  return s.trim().slice(0, max);
}

export type ModerationState = { ok: boolean; message?: string };

function revalidateModerationQuestion(
  pathname: string,
  lang: string
): void {
  if (pathname) revalidatePath(pathname);
  if (lang) revalidatePath(`/${lang}`);
  revalidatePath("/admin/moderation");
}

export async function setSubmissionImageUrl(
  _prev: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = sanitize(String(formData.get("id") ?? ""), 80);
  const image_url = sanitize(String(formData.get("image_url") ?? ""), 2000);
  const slugHint = sanitize(String(formData.get("slug_hint") ?? ""), 120);
  if (!id) return { ok: false, message: "Eksik kayıt." };

  const db = getSupabaseServiceRole();
  const slugPart = slugSegmentForStorage(slugHint || id);

  if (!image_url) {
    const { error } = await db
      .from("article_submissions")
      .update({ image_url: null })
      .eq("id", id)
      .eq("status", "pending");
    if (error) return { ok: false, message: "Güncellenemedi." };
    revalidatePath("/admin/moderation");
    return { ok: true, message: "Görsel kaldırıldı." };
  }

  const storagePath = `submissions/${id}/${slugPart}-${Date.now()}.webp`;
  const ing = await ingestRemoteImageAsWebpToStorage(db, image_url, storagePath);
  if ("error" in ing) {
    return { ok: false, message: ing.error };
  }

  const { error } = await db
    .from("article_submissions")
    .update({ image_url: ing.publicUrl })
    .eq("id", id)
    .eq("status", "pending");

  if (error) return { ok: false, message: "Güncellenemedi." };
  revalidatePath("/admin/moderation");
  return { ok: true, message: "Görsel indirildi, WebP olarak kaydedildi." };
}

export async function uploadSubmissionImage(
  _prev: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = sanitize(String(formData.get("id") ?? ""), 80);
  const slugHint = sanitize(String(formData.get("slug_hint") ?? ""), 120);
  const file = formData.get("file");
  if (!id) return { ok: false, message: "Eksik kayıt." };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Dosya seçin." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "En fazla 5 MB." };
  }
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return { ok: false, message: "Yalnız JPEG, PNG, WebP veya GIF." };
  }

  const db = getSupabaseServiceRole();
  const slugPart = slugSegmentForStorage(slugHint || id);
  const path = `submissions/${id}/${slugPart}-${Date.now()}.webp`;
  let webp: Buffer;
  try {
    webp = await bufferToWebp(Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      message: "Görsel WebP’ye çevrilemedi; dosya bozuk olabilir.",
    };
  }
  const { error: upErr } = await db.storage
    .from("blog-images")
    .upload(path, webp, { contentType: "image/webp", upsert: false });

  if (upErr) {
    console.error(upErr);
    return {
      ok: false,
      message:
        "Yükleme başarısız. Supabase Storage’da public bucket adı blog-images olmalı (bkz. supabase/storage_blog_images.sql).",
    };
  }

  const { data: pub } = db.storage.from("blog-images").getPublicUrl(path);

  const { error: dbErr } = await db
    .from("article_submissions")
    .update({ image_url: pub.publicUrl })
    .eq("id", id)
    .eq("status", "pending");

  if (dbErr) return { ok: false, message: "Veritabanı güncellenemedi." };
  revalidatePath("/admin/moderation");
  return { ok: true, message: "Görsel yüklendi." };
}

/** Yayında `questions` satırı — import edilen makaleler vb. */
export async function setQuestionImageUrl(
  _prev: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = sanitize(String(formData.get("id") ?? ""), 80);
  const image_url = sanitize(String(formData.get("image_url") ?? ""), 2000);
  const slugRaw = sanitize(String(formData.get("slug") ?? ""), 120);
  if (!id) return { ok: false, message: "Eksik kayıt." };

  const pathname = String(formData.get("pathname") ?? "").trim();
  const lang = String(formData.get("lang") ?? "").trim();

  const db = getSupabaseServiceRole();

  if (!image_url) {
    const { error } = await db
      .from("questions")
      .update({ image_url: null })
      .eq("id", id);
    if (error) return { ok: false, message: "Güncellenemedi." };
    revalidateModerationQuestion(pathname, lang);
    return { ok: true, message: "Görsel kaldırıldı." };
  }

  const storagePath = questionHeroStorageObjectPath(slugRaw || id);
  const ing = await ingestRemoteImageAsWebpToStorage(db, image_url, storagePath);
  if ("error" in ing) {
    return { ok: false, message: ing.error };
  }

  const { error } = await db
    .from("questions")
    .update({ image_url: ing.publicUrl })
    .eq("id", id);

  if (error) return { ok: false, message: "Güncellenemedi." };
  revalidateModerationQuestion(pathname, lang);
  return { ok: true, message: "Görsel indirildi, WebP olarak kaydedildi." };
}

export async function uploadQuestionImage(
  _prev: ModerationState,
  formData: FormData
): Promise<ModerationState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = sanitize(String(formData.get("id") ?? ""), 80);
  const slugRaw = sanitize(String(formData.get("slug") ?? ""), 120);
  const file = formData.get("file");
  if (!id) return { ok: false, message: "Eksik kayıt." };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Dosya seçin." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "En fazla 5 MB." };
  }
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return { ok: false, message: "Yalnız JPEG, PNG, WebP veya GIF." };
  }

  const db = getSupabaseServiceRole();
  const path = questionHeroStorageObjectPath(slugRaw || id);
  let webp: Buffer;
  try {
    webp = await bufferToWebp(Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    console.error(e);
    return {
      ok: false,
      message: "Görsel WebP’ye çevrilemedi; dosya bozuk olabilir.",
    };
  }
  const { error: upErr } = await db.storage
    .from("blog-images")
    .upload(path, webp, { contentType: "image/webp", upsert: false });

  if (upErr) {
    console.error(upErr);
    return {
      ok: false,
      message:
        "Yükleme başarısız. Storage bucket blog-images ve SUPABASE_SERVICE_ROLE_KEY kontrol edin.",
    };
  }

  const { data: pub } = db.storage.from("blog-images").getPublicUrl(path);

  const { error: dbErr } = await db
    .from("questions")
    .update({ image_url: pub.publicUrl })
    .eq("id", id);

  if (dbErr) return { ok: false, message: "Veritabanı güncellenemedi." };
  const pathname = String(formData.get("pathname") ?? "").trim();
  const lang = String(formData.get("lang") ?? "").trim();
  revalidateModerationQuestion(pathname, lang);
  return { ok: true, message: "Makale görseli yüklendi." };
}
