"use server";

import { revalidatePath } from "next/cache";
import { slugSegmentForStorage } from "@/lib/data/storage-slug";
import { getMasterUser } from "@/lib/admin/auth-server";
import { ingestRemoteImageAsWebpToStorage } from "@/lib/server/ingest-remote-image";
import { bufferToWebp } from "@/lib/server/image-webp";
import { getSupabaseServiceRole } from "@/lib/supabase/service";

export type MasterInlineState = { ok: boolean; message?: string };

const QUESTION_FIELDS = new Set([
  "title",
  "content",
  "excerpt",
  "author",
  "image_url",
  "category",
  "region",
]);

const PLACE_FIELDS = new Set([
  "name",
  "image",
  "ai_intro",
  "price_level",
  "rating",
]);

const ALLOWED_IMAGE = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;
const MAX_BYTES = 5 * 1024 * 1024;

function revalidateArticlePaths(pathname: string, lang: string) {
  revalidatePath(pathname);
  if (lang) revalidatePath(`/${lang}`);
}

export async function masterUpdateQuestionField(
  _prev: MasterInlineState,
  formData: FormData
): Promise<MasterInlineState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = String(formData.get("id") ?? "").trim();
  const field = String(formData.get("field") ?? "").trim();
  const pathname = String(formData.get("pathname") ?? "/").trim() || "/";
  const lang = String(formData.get("lang") ?? "").trim();
  if (!id || !QUESTION_FIELDS.has(field)) {
    return { ok: false, message: "Geçersiz istek." };
  }

  let value: unknown = String(formData.get("value") ?? "");
  const db = getSupabaseServiceRole();

  if (field === "excerpt" && String(value).trim() === "") {
    value = null;
  } else if (field === "image_url") {
    const t = String(value).trim();
    if (t === "") {
      value = null;
    } else if (
      /^https?:\/\//i.test(t) ||
      t.startsWith("/") ||
      t.startsWith("//")
    ) {
      const slugHint = String(formData.get("storage_slug") ?? "").trim();
      let slugBase = slugHint;
      if (!slugBase) {
        const { data: row } = await db
          .from("questions")
          .select("slug")
          .eq("id", id)
          .single();
        slugBase = row?.slug ?? id;
      }
      const slugPart = slugSegmentForStorage(slugBase);
      const ing = await ingestRemoteImageAsWebpToStorage(
        db,
        t,
        `questions/${id}/${slugPart}-${Date.now()}.webp`
      );
      if ("error" in ing) return { ok: false, message: ing.error };
      value = ing.publicUrl;
    }
  }

  const { error } = await db
    .from("questions")
    .update({ [field]: value })
    .eq("id", id);

  if (error) return { ok: false, message: "Kaydedilemedi." };
  revalidateArticlePaths(pathname, lang);
  return { ok: true, message: "Kaydedildi." };
}

export async function masterUpdateQuestionRelatedSlugs(
  _prev: MasterInlineState,
  formData: FormData
): Promise<MasterInlineState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = String(formData.get("id") ?? "").trim();
  const pathname = String(formData.get("pathname") ?? "/").trim() || "/";
  const lang = String(formData.get("lang") ?? "").trim();
  const raw = String(formData.get("value") ?? "");
  const related_slugs = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (!id) return { ok: false, message: "Geçersiz istek." };

  const db = getSupabaseServiceRole();
  const { error } = await db
    .from("questions")
    .update({ related_slugs })
    .eq("id", id);

  if (error) return { ok: false, message: "Kaydedilemedi." };
  revalidateArticlePaths(pathname, lang);
  return { ok: true, message: "İlişkili slug’lar güncellendi." };
}

export async function masterUpdatePlaceField(
  _prev: MasterInlineState,
  formData: FormData
): Promise<MasterInlineState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = String(formData.get("id") ?? "").trim();
  const field = String(formData.get("field") ?? "").trim();
  const pathname = String(formData.get("pathname") ?? "/").trim() || "/";
  const lang = String(formData.get("lang") ?? "").trim();
  if (!id || !PLACE_FIELDS.has(field)) {
    return { ok: false, message: "Geçersiz istek." };
  }

  const raw = String(formData.get("value") ?? "");
  const db = getSupabaseServiceRole();

  let payload: Record<string, unknown>;
  if (field === "rating") {
    const n = Number(raw.replace(",", "."));
    if (Number.isNaN(n) || n < 0) {
      return { ok: false, message: "Geçersiz puan." };
    }
    payload = { rating: n };
  } else if (field === "price_level") {
    if (!["$", "$$", "$$$"].includes(raw)) {
      return { ok: false, message: "Fiyat seviyesi $, $$ veya $$$ olmalı." };
    }
    payload = { price_level: raw };
  } else if (field === "image") {
    const t = raw.trim();
    if (t === "") {
      payload = { image: "" };
    } else if (
      /^https?:\/\//i.test(t) ||
      t.startsWith("/") ||
      t.startsWith("//")
    ) {
      const slugHint = String(formData.get("storage_slug") ?? "").trim();
      const slugPart = slugSegmentForStorage(slugHint || id);
      const ing = await ingestRemoteImageAsWebpToStorage(
        db,
        t,
        `places/${id}/${slugPart}-${Date.now()}.webp`
      );
      if ("error" in ing) return { ok: false, message: ing.error };
      payload = { image: ing.publicUrl };
    } else {
      payload = { image: t };
    }
  } else {
    payload = { [field]: raw };
  }

  const { error } = await db.from("places").update(payload).eq("id", id);

  if (error) return { ok: false, message: "Kaydedilemedi." };
  revalidatePath(pathname);
  if (lang) revalidatePath(`/${lang}`);
  return { ok: true, message: "Kaydedildi." };
}

export async function masterUploadPlaceImage(
  _prev: MasterInlineState,
  formData: FormData
): Promise<MasterInlineState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = String(formData.get("id") ?? "").trim();
  const pathname = String(formData.get("pathname") ?? "/").trim() || "/";
  const lang = String(formData.get("lang") ?? "").trim();
  const file = formData.get("file");
  if (!id) return { ok: false, message: "Geçersiz istek." };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Dosya seçin." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "En fazla 5 MB." };
  }
  if (!ALLOWED_IMAGE.includes(file.type as (typeof ALLOWED_IMAGE)[number])) {
    return { ok: false, message: "Yalnız JPEG, PNG, WebP veya GIF." };
  }

  const db = getSupabaseServiceRole();
  const slugHint = String(formData.get("storage_slug") ?? "").trim();
  const slugPart = slugSegmentForStorage(slugHint || id);
  const path = `places/${id}/${slugPart}-${Date.now()}.webp`;
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
      message: "Storage yüklemesi başarısız (blog-images bucket).",
    };
  }

  const { data: pub } = db.storage.from("blog-images").getPublicUrl(path);

  const { error: dbErr } = await db
    .from("places")
    .update({ image: pub.publicUrl })
    .eq("id", id);

  if (dbErr) return { ok: false, message: "Veritabanı güncellenemedi." };
  revalidatePath(pathname);
  if (lang) revalidatePath(`/${lang}`);
  return { ok: true, message: "Görsel yüklendi." };
}
