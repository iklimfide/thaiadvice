/**
 * Soru/makale kategorileri — tek kaynak (slug + TR/EN etiket).
 * Menü yalnızca buradan; DB’deki serbest metin alias’larla kanonik sluga indirgenir.
 */

export type QuestionCategoryDef = {
  slug: string;
  labelTr: string;
  labelEn: string;
};

export const QUESTION_CATEGORY_DEFS: readonly QuestionCategoryDef[] = [
  { slug: "yemek", labelTr: "Yemek", labelEn: "Food" },
  { slug: "vize", labelTr: "Vize", labelEn: "Visa" },
  { slug: "ulasim", labelTr: "Ulaşım", labelEn: "Transport" },
  { slug: "gece-hayati", labelTr: "Gece hayatı", labelEn: "Nightlife" },
  { slug: "yasam", labelTr: "Yaşam", labelEn: "Daily life" },
  { slug: "para-alisveris", labelTr: "Para ve alışveriş", labelEn: "Money & shopping" },
  {
    slug: "alisilmadik-durumlar",
    labelTr: "Alışılmadık Durumlar",
    labelEn: "Unexpected situations",
  },
  { slug: "saglik", labelTr: "Sağlık", labelEn: "Health" },
  { slug: "guvenlik", labelTr: "Güvenlik", labelEn: "Safety" },
  { slug: "kurumsal", labelTr: "Kurumsal", labelEn: "About" },
] as const;

const SLUG_SET = new Set(QUESTION_CATEGORY_DEFS.map((d) => d.slug));

/** Serbest metin / eski yazımlar → kanonik slug */
const EXTRA_ALIASES: Record<string, string> = {
  para: "para-alisveris",
  "alışveriş": "para-alisveris",
  alisveris: "para-alisveris",
  "para ve alışveriş": "para-alisveris",
  "para ve alisveris": "para-alisveris",
  "para-alışveriş": "para-alisveris",
  money: "para-alisveris",
  shopping: "para-alisveris",
  ulasım: "ulasim",
  "ulaşım": "ulasim",
  sağlık: "saglik",
  güvenlik: "guvenlik",
  "gece hayatı": "gece-hayati",
  "gece hayati": "gece-hayati",
  "ozel-durumlar": "alisilmadik-durumlar",
  "özel-durumlar": "alisilmadik-durumlar",
  "özel durumlar": "alisilmadik-durumlar",
  "ozel durumlar": "alisilmadik-durumlar",
  "special cases": "alisilmadik-durumlar",
  kurumsal: "kurumsal",
  corporate: "kurumsal",
  about: "kurumsal",
};

function buildAliasToSlug(): Record<string, string> {
  const m: Record<string, string> = { ...EXTRA_ALIASES };
  for (const d of QUESTION_CATEGORY_DEFS) {
    m[d.slug.toLowerCase()] = d.slug;
    m[d.labelTr.toLowerCase()] = d.slug;
    m[d.labelEn.toLowerCase()] = d.slug;
  }
  return m;
}

const ALIAS_TO_SLUG = buildAliasToSlug();

function normKey(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/** DB veya URL parçası → kanonik slug; bilinmiyorsa null */
export function normalizeQuestionCategorySlug(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  const bySpace = normKey(t);
  if (ALIAS_TO_SLUG[bySpace]) return ALIAS_TO_SLUG[bySpace];
  const hyphen = t.trim().toLowerCase();
  if (ALIAS_TO_SLUG[hyphen]) return ALIAS_TO_SLUG[hyphen];
  if (SLUG_SET.has(t)) return t;
  if (SLUG_SET.has(hyphen)) return hyphen;
  return null;
}

export function categoryLabelForLang(rawOrSlug: string, lang: string): string {
  const slug = normalizeQuestionCategorySlug(rawOrSlug) ?? rawOrSlug.trim();
  const def = QUESTION_CATEGORY_DEFS.find((d) => d.slug === slug);
  if (!def) return rawOrSlug.trim() || slug;
  return lang === "tr" ? def.labelTr : def.labelEn;
}

/** Linkte kanonik slug (SEO/tutarlılık); eşleşme yoksa DB değeri */
export function categorySlugForUrl(dbCategory: string): string {
  return normalizeQuestionCategorySlug(dbCategory) ?? dbCategory.trim();
}

export function isKnownQuestionCategorySlug(slug: string): boolean {
  return SLUG_SET.has(slug.trim());
}

function uniqueCategoryKeys(segment: string): string[] {
  const out: string[] = [];
  const push = (s: string) => {
    const t = s.trim();
    if (t && !out.includes(t)) out.push(t);
  };
  push(segment);
  push(segment.toLowerCase());
  return out;
}

const CANON_TO_ALIASES: Map<string, Set<string>> = (() => {
  const m = new Map<string, Set<string>>();
  for (const d of QUESTION_CATEGORY_DEFS) {
    m.set(d.slug, new Set([d.slug]));
  }
  for (const [alias, slug] of Object.entries(ALIAS_TO_SLUG)) {
    if (!m.has(slug)) m.set(slug, new Set());
    m.get(slug)!.add(alias);
  }
  return m;
})();

/** URL’deki kategori segmenti için DB’de aranacak tüm olası category string’leri */
export function categoryKeysForUrlResolution(categorySegment: string): string[] {
  const keys = new Set<string>();
  for (const k of uniqueCategoryKeys(categorySegment)) keys.add(k);
  const canon = normalizeQuestionCategorySlug(categorySegment);
  if (canon) {
    const aliases = CANON_TO_ALIASES.get(canon);
    if (aliases) {
      for (const a of Array.from(aliases)) {
        for (const k of uniqueCategoryKeys(a)) keys.add(k);
      }
    }
  }
  return Array.from(keys);
}
