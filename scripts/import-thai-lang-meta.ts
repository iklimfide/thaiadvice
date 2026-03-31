import { categorySlugForUrl } from "../lib/data/question-categories";
import { isSiteLang } from "../lib/seo/site-languages";

const NAME_TO_CODE: Record<string, string> = {
  turkish: "tr",
  türkçe: "tr",
  english: "en",
  ingilizce: "en",
};

/**
 * HEADER/frontmatter: LANGUAGE_CODE | LANG | LANGUAGE | DIL_KODU | DIL — makale `lang` ve kanonik URL dili.
 */
export function resolveImportArticleLang(
  meta: Record<string, string>,
  fallback: string
): string {
  const raw = (
    meta.LANGUAGE_CODE ||
    meta.LANG ||
    meta.LANGUAGE ||
    meta.DIL_KODU ||
    meta.DIL ||
    ""
  ).trim();
  if (!raw) return fallback;
  const lower = raw.toLowerCase();
  const compact = lower.replace(/\s+/g, "");
  if (isSiteLang(compact)) return compact;
  if (isSiteLang(lower.slice(0, 2))) return lower.slice(0, 2);
  const byName = NAME_TO_CODE[lower] ?? NAME_TO_CODE[compact];
  if (byName) return byName;
  if (/^[a-z]{2}$/.test(compact)) return compact;
  return fallback;
}

export function logImportArticlePageUrl(
  lang: string,
  region: string,
  category: string,
  slug: string
): void {
  const origin = (
    process.env.IMPORT_SITE_ORIGIN?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    ""
  ).replace(/\/$/, "");
  if (!origin) return;
  const cat = categorySlugForUrl(category);
  console.log(`Sayfa: ${origin}/${lang}/${region}/${cat}/${slug}`);
}
