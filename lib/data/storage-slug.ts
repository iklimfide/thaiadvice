/** Storage dosya adları için güvenli parça (sunucu + istemci). */
export function slugSegmentForStorage(raw: string, max = 72): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u00C0-\u024F-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
  return s || "gorsel";
}

/**
 * Soru kapak görseli (blog-images bucket):
 * `questions/{slug}/{slug}-{timestamp}.webp` — klasör ve dosya kökü makale `slug` ile;
 * boşluklar ve özel karakterler `slugSegmentForStorage` ile tireye indirgenir.
 */
export function questionHeroStorageObjectPath(slugOrFallback: string): string {
  const slugPart = slugSegmentForStorage(slugOrFallback);
  return `questions/${slugPart}/${slugPart}-${Date.now()}.webp`;
}
