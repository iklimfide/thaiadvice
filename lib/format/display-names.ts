/**
 * Veritabanında küçük harf (ör. tayland) saklansa bile arayüzde ülke/bölge adını düzgün gösterir.
 * Çok kelimeli yer adları (ör. Chiang Mai) için her kelimenin baş harfini büyütür; tek kelimede
 * önceki davranış korunur.
 */
function capitalizeWords(str: string, locale: string): string {
  return str
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      const first = word.charAt(0).toLocaleUpperCase(locale);
      const rest = word.slice(1).toLocaleLowerCase(locale);
      return first + rest;
    })
    .join(" ");
}

export function displayRegionTitle(
  name: string | null | undefined,
  slug: string,
  lang: string
): string {
  const raw = (name?.trim() || slug).trim();
  if (!raw) return slug;
  const locale = lang === "tr" ? "tr-TR" : "en-US";
  return capitalizeWords(raw, locale);
}
