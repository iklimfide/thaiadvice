/** Storage dosya adları için güvenli parça (sunucu + istemci). */
export function slugSegmentForStorage(raw: string, max = 72): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^\w\u00C0-\u024F-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
  return s || "gorsel";
}
