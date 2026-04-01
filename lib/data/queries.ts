import { cache } from "react";
import { getSupabaseOrNull } from "@/lib/supabase/server";
import {
  categoryKeysForUrlResolution,
  normalizeQuestionCategorySlug,
  QUESTION_CATEGORY_DEFS,
} from "@/lib/data/question-categories";
import { isSiteLang } from "@/lib/seo/site-languages";
import {
  mapFaqEntryRow,
  mapFaqItemRow,
  mapPlaceRow,
  mapQuestionRow,
  mapRegionRow,
  mapSubRegionRow,
} from "@/lib/data/map-rows";
import type {
  FaqEntryRow,
  FaqItemRow,
  PlaceRow,
  QuestionRow,
  RegionRow,
  SubRegionRow,
} from "@/lib/types/database";

const SUPABASE_LOG_MSG_MAX = 400;

/** Cloudflare/502 responses arrive as HTML in error.message — avoid megabyte console dumps. */
function summarizeSupabaseErrorMessage(raw: string): string {
  const t = raw.trim();
  if (t.startsWith("<!DOCTYPE") || t.startsWith("<html")) {
    const title = t.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim();
    const is502 = /502|Bad gateway/i.test(t);
    if (title) {
      return is502
        ? `Upstream HTML (likely 502): ${title}`
        : `Upstream HTML instead of JSON: ${title}`;
    }
    return is502
      ? "Upstream returned HTML 502 Bad Gateway page (body omitted)."
      : "Upstream returned HTML instead of JSON (body omitted).";
  }
  if (t.length > SUPABASE_LOG_MSG_MAX) {
    return `${t.slice(0, SUPABASE_LOG_MSG_MAX)}… [truncated, ${t.length} chars]`;
  }
  return t;
}

function logSupabase(
  context: string,
  err: { message?: string; code?: string; details?: string; hint?: string } | Error
) {
  const raw =
    "message" in err && err.message ? err.message : String(err);
  const msg = summarizeSupabaseErrorMessage(raw);
  const extra =
    err && typeof err === "object" && "code" in err
      ? { code: err.code, details: err.details, hint: err.hint }
      : {};
  console.error(`[Supabase:${context}]`, msg, extra);
}

/** Tek istekte layout + ana sayfa aynı sonucu paylaşır */
export type RegionsFromSupabase = {
  regions: RegionRow[];
  error: string | null;
};

export const loadRegionsFromSupabase = cache(
  async (): Promise<RegionsFromSupabase> => {
    const sb = getSupabaseOrNull();
    if (!sb) {
      return { regions: [], error: null };
    }
    const { data, error } = await sb
      .from("regions")
      .select("*")
      .order("slug", { ascending: true });
    if (error) {
      logSupabase("regions", error);
      return { regions: [], error: error.message };
    }
    return {
      regions: (data ?? []).map(mapRegionRow),
      error: null,
    };
  }
);

export async function listRegions(): Promise<RegionRow[]> {
  const { regions } = await loadRegionsFromSupabase();
  return regions;
}

export async function getRegionBySlug(
  slug: string
): Promise<RegionRow | null> {
  const sb = getSupabaseOrNull();
  if (!sb) return null;
  const { data, error } = await sb
    .from("regions")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    logSupabase("getRegionBySlug", error);
    return null;
  }
  return data ? mapRegionRow(data) : null;
}

export async function listSubRegionsForRegion(
  regionId: string
): Promise<SubRegionRow[]> {
  const sb = getSupabaseOrNull();
  if (!sb) return [];
  const { data, error } = await sb
    .from("sub_regions")
    .select("*")
    .eq("region_id", regionId)
    .order("slug", { ascending: true });
  if (error) {
    logSupabase("listSubRegionsForRegion", error);
    return [];
  }
  return (data ?? []).map(mapSubRegionRow);
}

export async function getSubRegionBySlug(
  regionId: string,
  slug: string
): Promise<SubRegionRow | null> {
  const sb = getSupabaseOrNull();
  if (!sb) return null;
  const { data, error } = await sb
    .from("sub_regions")
    .select("*")
    .eq("region_id", regionId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    logSupabase("getSubRegionBySlug", error);
    return null;
  }
  return data ? mapSubRegionRow(data) : null;
}

export async function listPlacesForSubRegion(
  subRegionId: string
): Promise<PlaceRow[]> {
  const sb = getSupabaseOrNull();
  if (!sb) return [];
  const { data, error } = await sb
    .from("places")
    .select("*")
    .eq("sub_region_id", subRegionId)
    .order("slug", { ascending: true });
  if (error) {
    logSupabase("listPlacesForSubRegion", error);
    return [];
  }
  return (data ?? []).map(mapPlaceRow);
}

export async function getPlaceBySlug(
  subRegionId: string,
  slug: string
): Promise<PlaceRow | null> {
  const sb = getSupabaseOrNull();
  if (!sb) return null;
  const { data, error } = await sb
    .from("places")
    .select("*")
    .eq("sub_region_id", subRegionId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    logSupabase("getPlaceBySlug", error);
    return null;
  }
  return data ? mapPlaceRow(data) : null;
}

/**
 * İçerik detayı: /[lang]/[regionSlug]/[category]/[articleSlug]
 * `questions.region` metin alanı `regions.slug` ile aynı olmalı (örn. tayland).
 */
export async function getQuestionByPath(
  lang: string,
  regionKey: string,
  category: string,
  articleSlug: string,
  includeHidden = false
): Promise<QuestionRow | null> {
  const sb = getSupabaseOrNull();
  if (!sb) return null;
  let q = sb
    .from("questions")
    .select("*")
    .eq("lang", lang)
    .eq("region", regionKey)
    .eq("category", category)
    .eq("slug", articleSlug);
  if (!includeHidden) q = q.eq("is_hidden", false);
  const { data, error } = await q.maybeSingle();
  if (error) {
    logSupabase("getQuestionByPath", error);
    return null;
  }
  return data ? mapQuestionRow(data) : null;
}

/** Postgres `=` büyük/küçük harfe duyarlı; URL ve DB farklı yazılmış olabilir. */
function uniqueRegionKeys(
  urlSegment: string,
  regionRow: RegionRow | null
): string[] {
  const out: string[] = [];
  const push = (s: string) => {
    const t = s.trim();
    if (t && !out.includes(t)) out.push(t);
  };
  push(urlSegment);
  push(urlSegment.toLowerCase());
  if (regionRow?.slug) {
    push(regionRow.slug);
    push(regionRow.slug.toLowerCase());
  }
  return out;
}

export type ResolvedArticleDetail = {
  question: QuestionRow;
  /** regions tablosunda satır varsa; yoksa makale yine açılır */
  regionRow: RegionRow | null;
};

/**
 * /[lang]/[region]/[category]/[slug] için soru satırını bulur.
 * — Büyük/küçük harf farkı
 * — regions’ta tayland yoksa bile questions.region URL ile eşleşebilir
 * — Aynı slug birden fazlaysa region+category (case-insensitive) ile daraltır
 * — Son çare: dilde tek slug satırı
 */
export async function resolveArticleDetail(
  lang: string,
  regionSegment: string,
  categorySegment: string,
  articleSlug: string,
  options?: { includeHidden?: boolean }
): Promise<ResolvedArticleDetail | null> {
  const slug = articleSlug.trim();
  if (!slug) return null;

  const includeHidden = Boolean(options?.includeHidden);
  const regionRow = await getRegionBySlug(regionSegment);
  const rKeys = uniqueRegionKeys(regionSegment, regionRow);
  const cKeys = categoryKeysForUrlResolution(categorySegment);

  for (const rk of rKeys) {
    for (const ck of cKeys) {
      const q = await getQuestionByPath(lang, rk, ck, slug, includeHidden);
      if (q) return { question: q, regionRow };
    }
  }

  const sbSlug = getSupabaseOrNull();
  if (!sbSlug) return null;
  let slugQuery = sbSlug
    .from("questions")
    .select("*")
    .eq("lang", lang)
    .eq("slug", slug);
  if (!includeHidden) slugQuery = slugQuery.eq("is_hidden", false);
  const { data, error } = await slugQuery;

  if (error) {
    logSupabase("resolveArticleDetail(slug)", error);
    return null;
  }
  if (!data?.length) return null;

  if (data.length === 1) {
    return { question: mapQuestionRow(data[0]), regionRow };
  }

  const narrowed = data.filter((raw) => {
    const q = mapQuestionRow(raw);
    const regOk = rKeys.some(
      (rk) => rk.toLowerCase() === q.region.toLowerCase()
    );
    const catOk = cKeys.some(
      (ck) => ck.toLowerCase() === q.category.toLowerCase()
    );
    return regOk && catOk;
  });

  if (narrowed.length === 1) {
    return { question: mapQuestionRow(narrowed[0]), regionRow };
  }

  return null;
}

/**
 * Aynı makale için (slug + URL’deki bölge/kategori ile eşleşen) tüm dil satırları — hreflang.
 */
export async function listQuestionAlternatesForUrl(
  regionSegment: string,
  categorySegment: string,
  articleSlug: string
): Promise<QuestionRow[]> {
  const slug = articleSlug.trim();
  if (!slug) return [];

  const regionRow = await getRegionBySlug(regionSegment);
  const rKeys = uniqueRegionKeys(regionSegment, regionRow);
  const cKeys = categoryKeysForUrlResolution(categorySegment);

  const sbAlt = getSupabaseOrNull();
  if (!sbAlt) return [];
  const { data, error } = await sbAlt
    .from("questions")
    .select("*")
    .eq("slug", slug);

  if (error) {
    logSupabase("listQuestionAlternatesForUrl", error);
    return [];
  }

  return (data ?? [])
    .map(mapQuestionRow)
    .filter((q) => {
      if (!isSiteLang(q.lang)) return false;
      const regOk = rKeys.some(
        (rk) => rk.toLowerCase() === q.region.toLowerCase()
      );
      const catOk = cKeys.some(
        (ck) => ck.toLowerCase() === q.category.toLowerCase()
      );
      return regOk && catOk;
    });
}

export async function listQuestionsForLang(
  lang: string,
  options?: { includeHidden?: boolean; regionSlug?: string }
): Promise<QuestionRow[]> {
  const sb = getSupabaseOrNull();
  if (!sb) return [];
  let q = sb
    .from("questions")
    .select("*")
    .eq("lang", lang)
    .order("created_at", { ascending: false });
  if (!options?.includeHidden) q = q.eq("is_hidden", false);
  const regionSlug = options?.regionSlug?.trim();
  if (regionSlug) q = q.eq("region", regionSlug);
  const { data, error } = await q;
  if (error) {
    logSupabase("listQuestionsForLang", error);
    return [];
  }
  const rows = data ?? [];
  if (
    process.env.NODE_ENV === "development" &&
    process.env.SUPABASE_DEBUG === "1" &&
    rows.length === 0
  ) {
    console.warn(
      `[Supabase:listQuestionsForLang] lang=${lang} → 0 satır (RLS, yanlış proje URL/anahtar, veya gerçekten boş).`
    );
  }
  return rows.map(mapQuestionRow);
}

const RELATED_QUESTIONS_FETCH_CAP = 150;

/**
 * Makale detayı: aynı dil, mevcut makale hariç.
 * Öncelik: aynı kategori + bölge → aynı kategori → aynı bölge → son yayınlar.
 */
export async function listRelatedQuestionsForArticle(
  lang: string,
  excludeQuestionId: string,
  currentCategory: string,
  urlRegionSegment: string,
  regionRow: RegionRow | null,
  limit = 6
): Promise<QuestionRow[]> {
  const rKeys = uniqueRegionKeys(urlRegionSegment, regionRow);
  const catCanon = normalizeQuestionCategorySlug(currentCategory);

  const sbRel = getSupabaseOrNull();
  if (!sbRel) return [];
  const { data, error } = await sbRel
    .from("questions")
    .select("*")
    .eq("lang", lang)
    .eq("is_hidden", false)
    .neq("id", excludeQuestionId)
    .order("created_at", { ascending: false })
    .limit(RELATED_QUESTIONS_FETCH_CAP);

  if (error) {
    logSupabase("listRelatedQuestionsForArticle", error);
    return [];
  }

  const rows = (data ?? []).map(mapQuestionRow);

  const regionMatch = (q: QuestionRow) =>
    rKeys.some((rk) => rk.toLowerCase() === q.region.trim().toLowerCase());

  const catMatch = (q: QuestionRow) => {
    if (catCanon) {
      return normalizeQuestionCategorySlug(q.category) === catCanon;
    }
    return (
      q.category.trim().toLowerCase() === currentCategory.trim().toLowerCase()
    );
  };

  const picked: QuestionRow[] = [];
  const seen = new Set<string>();

  const pushUnique = (candidates: QuestionRow[]) => {
    for (const q of candidates) {
      if (picked.length >= limit) return;
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      picked.push(q);
    }
  };

  pushUnique(rows.filter((q) => catMatch(q) && regionMatch(q)));
  pushUnique(rows.filter((q) => catMatch(q)));
  pushUnique(rows.filter((q) => regionMatch(q)));
  pushUnique(rows);

  return picked.slice(0, limit);
}

/** Aynı alt bölgedeki diğer mekânlar (alfabetik sırada, mevcut hariç). */
export async function listRelatedPlacesInSubRegion(
  subRegionId: string,
  excludePlaceId: string,
  limit = 6
): Promise<PlaceRow[]> {
  const all = await listPlacesForSubRegion(subRegionId);
  return all.filter((p) => p.id !== excludePlaceId).slice(0, limit);
}

export type NavQuestionCategory = { slug: string; label: string };

/** Header menüsü: kanonik sıra, yalnızca içerik olan slug’lar */
export const loadNavQuestionCategories = cache(
  async (lang: string): Promise<NavQuestionCategory[]> => {
    const sb = getSupabaseOrNull();
    if (!sb) return [];
    const { data, error } = await sb
      .from("questions")
      .select("category")
      .eq("lang", lang)
      .eq("is_hidden", false);
    if (error) {
      logSupabase("loadNavQuestionCategories", error);
      return [];
    }
    const slugSet = new Set<string>();
    /** Kurumsal tek sayfa; kategori filtresinde listelenmesin */
    const excludeFromNav = new Set(["kurumsal"]);
    for (const row of data ?? []) {
      const raw = (row as { category?: string }).category;
      const c = typeof raw === "string" ? raw.trim() : "";
      if (!c) continue;
      const n = normalizeQuestionCategorySlug(c);
      if (n && !excludeFromNav.has(n)) slugSet.add(n);
    }
    return QUESTION_CATEGORY_DEFS.filter((d) => slugSet.has(d.slug)).map(
      (d) => ({
        slug: d.slug,
        label: lang === "tr" ? d.labelTr : d.labelEn,
      })
    );
  }
);

export async function listNavQuestionCategories(
  lang: string
): Promise<NavQuestionCategory[]> {
  return loadNavQuestionCategories(lang);
}

/**
 * faq_entries.category ile eşleşen kayıtlar (sort_order’a göre).
 * Sayfa seviyesinde category olarak bölge / alt bölge / mekân slug’ı kullanılır.
 */
export async function listFaqByCategory(
  category: string
): Promise<FaqEntryRow[]> {
  const c = category.trim();
  if (!c) return [];

  const sbFaq = getSupabaseOrNull();
  if (!sbFaq) return [];
  const { data, error } = await sbFaq
    .from("faq_entries")
    .select("*")
    .eq("category", c)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    logSupabase("listFaqByCategory", error);
    return [];
  }
  return (data ?? []).map(mapFaqEntryRow);
}

/** public.faq_items — short_answer sütunu (faq_entries’ten ayrı). */
export async function listFaqItemsByCategory(
  category: string
): Promise<FaqItemRow[]> {
  const c = category.trim();
  if (!c) return [];

  const sbItems = getSupabaseOrNull();
  if (!sbItems) return [];
  const { data, error } = await sbItems
    .from("faq_items")
    .select("*")
    .eq("category", c)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    logSupabase("listFaqItemsByCategory", error);
    return [];
  }
  return (data ?? []).map(mapFaqItemRow);
}
