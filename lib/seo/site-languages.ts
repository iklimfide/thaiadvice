/**
 * Çok dilli SEO: hreflang, og:locale ve sitemap ile aynı dil listesi.
 * Yeni dil eklendiğinde burayı, sitemap’i ve çeviri içeriklerini birlikte güncelleyin.
 */
export const SITE_LANGS = ["tr", "en"] as const;

export type SiteLang = (typeof SITE_LANGS)[number];

/** x-default ve kök yönlendirme hedefi */
export const DEFAULT_SITE_LANG: SiteLang = "tr";

export function isSiteLang(s: string): s is SiteLang {
  return (SITE_LANGS as readonly string[]).includes(s);
}

/** Open Graph locale (BCP47 benzeri) */
export function openGraphLocaleForLang(lang: string): string {
  const l = lang.trim().toLowerCase();
  if (l === "tr") return "tr_TR";
  if (l === "en") return "en_US";
  return `${l}_${l.toUpperCase()}`;
}

export function alternateOpenGraphLocales(currentLang: string): string[] {
  const cur = currentLang.trim().toLowerCase();
  return SITE_LANGS.filter((l) => l !== cur).map(openGraphLocaleForLang);
}
