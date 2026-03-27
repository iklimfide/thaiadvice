/**
 * Veritabanında küçük harf (ör. tayland) saklansa bile arayüzde ülke/bölge adını düzgün gösterir.
 */
export function displayRegionTitle(
  name: string | null | undefined,
  slug: string,
  lang: string
): string {
  const raw = (name?.trim() || slug).trim();
  if (!raw) return slug;
  const locale = lang === "tr" ? "tr-TR" : "en-US";
  const first = raw.charAt(0).toLocaleUpperCase(locale);
  const rest = raw.slice(1).toLocaleLowerCase(locale);
  return first + rest;
}
