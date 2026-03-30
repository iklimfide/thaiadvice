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

export type MasterInlineState = { ok: boolean; message?: string };

const QUESTION_FIELDS = new Set([
  "title",
  "content",
  "excerpt",
  "author",
  "image_url",
  "media_seo_text",
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

const REGION_FIELDS = new Set(["name", "description", "image"]);

const SUB_REGION_FIELDS = new Set(["name", "description", "image"]);

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

function revalidateRegionPaths(pathname: string, lang: string) {
  revalidatePath(pathname);
  if (lang) {
    revalidatePath(`/${lang}`);
    revalidatePath(`/${lang}`, "layout");
  }
}

/** Alt bölge kartı: bölge listesi + (varsa) alt bölge detay sayfası */
function revalidateSubRegionPaths(pathname: string, lang: string) {
  revalidatePath(pathname);
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length >= 3) {
    revalidatePath(`/${segs[0]}/${segs[1]}`);
  }
  if (lang) {
    revalidatePath(`/${lang}`);
    revalidatePath(`/${lang}`, "layout");
  }
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

  if (
    (field === "excerpt" || field === "media_seo_text") &&
    String(value).trim() === ""
  ) {
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
      const ing = await ingestRemoteImageAsWebpToStorage(
        db,
        t,
        questionHeroStorageObjectPath(slugBase)
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

export async function masterSetQuestionHidden(
  _prev: MasterInlineState,
  formData: FormData
): Promise<MasterInlineState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = String(formData.get("id") ?? "").trim();
  const pathname = String(formData.get("pathname") ?? "/").trim() || "/";
  const lang = String(formData.get("lang") ?? "").trim();
  const raw = String(formData.get("is_hidden") ?? "").trim();
  const is_hidden = raw === "true" || raw === "1";

  if (!id) return { ok: false, message: "Geçersiz istek." };

  const db = getSupabaseServiceRole();
  const { error } = await db
    .from("questions")
    .update({ is_hidden })
    .eq("id", id);

  if (error) return { ok: false, message: "Kaydedilemedi." };
  revalidateArticlePaths(pathname, lang);
  if (lang) revalidatePath(`/${lang}`, "layout");
  return {
    ok: true,
    message: is_hidden ? "Makale gizlendi." : "Makale yayında.",
  };
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

export async function masterUpdateRegionField(
  _prev: MasterInlineState,
  formData: FormData
): Promise<MasterInlineState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = String(formData.get("id") ?? "").trim();
  const field = String(formData.get("field") ?? "").trim();
  const pathname = String(formData.get("pathname") ?? "/").trim() || "/";
  const lang = String(formData.get("lang") ?? "").trim();
  if (!id || !REGION_FIELDS.has(field)) {
    return { ok: false, message: "Geçersiz istek." };
  }

  const raw = String(formData.get("value") ?? "");
  const db = getSupabaseServiceRole();

  let payload: Record<string, unknown>;
  if (field === "image") {
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
        `regions/${id}/${slugPart}-${Date.now()}.webp`
      );
      if ("error" in ing) return { ok: false, message: ing.error };
      payload = { image: ing.publicUrl };
    } else {
      payload = { image: t };
    }
  } else {
    payload = { [field]: raw };
  }

  const { error } = await db.from("regions").update(payload).eq("id", id);

  if (error) return { ok: false, message: "Kaydedilemedi." };
  revalidateRegionPaths(pathname, lang);
  return { ok: true, message: "Kaydedildi." };
}

export async function masterUploadRegionImage(
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
  const path = `regions/${id}/${slugPart}-${Date.now()}.webp`;
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
    .from("regions")
    .update({ image: pub.publicUrl })
    .eq("id", id);

  if (dbErr) return { ok: false, message: "Veritabanı güncellenemedi." };
  revalidateRegionPaths(pathname, lang);
  return { ok: true, message: "Görsel yüklendi." };
}

export async function masterUpdateSubRegionField(
  _prev: MasterInlineState,
  formData: FormData
): Promise<MasterInlineState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const id = String(formData.get("id") ?? "").trim();
  const field = String(formData.get("field") ?? "").trim();
  const pathname = String(formData.get("pathname") ?? "/").trim() || "/";
  const lang = String(formData.get("lang") ?? "").trim();
  if (!id || !SUB_REGION_FIELDS.has(field)) {
    return { ok: false, message: "Geçersiz istek." };
  }

  const raw = String(formData.get("value") ?? "");
  const db = getSupabaseServiceRole();

  let payload: Record<string, unknown>;
  if (field === "image") {
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
        `sub_regions/${id}/${slugPart}-${Date.now()}.webp`
      );
      if ("error" in ing) return { ok: false, message: ing.error };
      payload = { image: ing.publicUrl };
    } else {
      payload = { image: t };
    }
  } else {
    payload = { [field]: raw };
  }

  const { error } = await db.from("sub_regions").update(payload).eq("id", id);

  if (error) return { ok: false, message: "Kaydedilemedi." };
  revalidateSubRegionPaths(pathname, lang);
  return { ok: true, message: "Kaydedildi." };
}

export async function masterUploadSubRegionImage(
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
  const path = `sub_regions/${id}/${slugPart}-${Date.now()}.webp`;
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
    .from("sub_regions")
    .update({ image: pub.publicUrl })
    .eq("id", id);

  if (dbErr) return { ok: false, message: "Veritabanı güncellenemedi." };
  revalidateSubRegionPaths(pathname, lang);
  return { ok: true, message: "Görsel yüklendi." };
}

export type MasterInsertSubRegionState = { ok: boolean; message?: string };

function slugFromNameLatin(name: string): string {
  const t = name
    .trim()
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return t || "alt-bolge";
}

export async function masterInsertSubRegion(
  _prev: MasterInsertSubRegionState,
  formData: FormData
): Promise<MasterInsertSubRegionState> {
  const user = await getMasterUser();
  if (!user) return { ok: false, message: "Yetkisiz." };

  const regionId = String(formData.get("region_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const description = String(formData.get("description") ?? "").trim();
  const pathname = String(formData.get("pathname") ?? "/").trim() || "/";
  const lang = String(formData.get("lang") ?? "").trim();

  if (!regionId || !name) {
    return { ok: false, message: "Bölge ve görünen ad zorunlu." };
  }
  if (!slug) slug = slugFromNameLatin(name);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      message:
        "Slug yalnız küçük harf, rakam ve tire; boş bırakırsanız addan üretilir.",
    };
  }

  const db = getSupabaseServiceRole();
  const { data: clash } = await db
    .from("sub_regions")
    .select("id")
    .eq("region_id", regionId)
    .eq("slug", slug)
    .maybeSingle();
  if (clash) {
    return { ok: false, message: "Bu bölgede aynı slug zaten var." };
  }

  const id = crypto.randomUUID();
  const { error } = await db.from("sub_regions").insert({
    id,
    region_id: regionId,
    name,
    slug,
    description: description || "",
    image: "",
  });

  if (error) {
    console.error("[masterInsertSubRegion]", error);
    return { ok: false, message: "Kayıt eklenemedi (Supabase)." };
  }
  revalidateSubRegionPaths(pathname, lang);
  return {
    ok: true,
    message: `Alt bölge eklendi (slug: ${slug}).`,
  };
}
