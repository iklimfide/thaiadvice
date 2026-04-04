import type { ArticleExtraImage } from "@/lib/types/database";

export const ARTICLE_EXTRA_IMAGES_MAX = 12;

const MAX_ITEMS = ARTICLE_EXTRA_IMAGES_MAX;
const MAX_URL = 2000;
const MAX_ALT = 500;

/**
 * DB / API’den gelen jsonb değerini güvenli diziye çevirir.
 */
export function parseArticleExtraImages(raw: unknown): ArticleExtraImage[] {
  if (!Array.isArray(raw)) return [];
  const out: ArticleExtraImage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const url = typeof o.url === "string" ? o.url.trim() : "";
    if (!url) continue;
    const altRaw = o.alt;
    const alt =
      altRaw != null && String(altRaw).trim()
        ? String(altRaw).trim().slice(0, MAX_ALT)
        : undefined;
    out.push({
      url: url.slice(0, MAX_URL),
      ...(alt ? { alt } : {}),
    });
    if (out.length >= MAX_ITEMS) break;
  }
  return out;
}

/** Zaten blog-images bucket’ında — yeniden indirip yükleme */
export function isBlogImagesStoragePublicUrl(url: string): boolean {
  return /supabase\.co\/storage\/v1\/object\/public\/blog-images\//i.test(
    url.trim()
  );
}
