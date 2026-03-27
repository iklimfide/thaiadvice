import { cache } from "react";
import { getSupabase } from "@/lib/supabase/server";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import {
  categoryKeysForUrlResolution,
  normalizeQuestionCategorySlug,
  QUESTION_CATEGORY_DEFS,
} from "@/lib/data/question-categories";
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

function logSupabase(
  context: string,
  err: { message?: string; code?: string; details?: string; hint?: string } | Error
) {
  const msg = "message" in err && err.message ? err.message : String(err);
  const extra =
    err && typeof err === "object" && "code" in err
      ? { code: err.code, details: err.details, hint: err.hint }
      : {};
  console.error(`[Supabase:${context}]`, msg, extra, err);
}

/** Tek istekte layout + ana sayfa aynı sonucu paylaşır */
export type RegionsFromSupabase = {
  regions: RegionRow[];
  error: string | null;
};

export const loadRegionsFromSupabase = cache(
  async (): Promise<RegionsFromSupabase> => {
    if (!isSupabasePublicConfigured()) {
      return { regions: [], error: null };
    }
    const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
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
  const { data, error } = await getSupabase()
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
  articleSlug: string
): Promise<QuestionRow | null> {
  const { data, error } = await getSupabase()
    .from("questions")
    .select("*")
    .eq("lang", lang)
    .eq("region", regionKey)
    .eq("category", category)
    .eq("slug", articleSlug)
    .maybeSingle();
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
  articleSlug: string
): Promise<ResolvedArticleDetail | null> {
  const slug = articleSlug.trim();
  if (!slug) return null;

  const regionRow = await getRegionBySlug(regionSegment);
  const rKeys = uniqueRegionKeys(regionSegment, regionRow);
  const cKeys = categoryKeysForUrlResolution(categorySegment);

  for (const rk of rKeys) {
    for (const ck of cKeys) {
      const q = await getQuestionByPath(lang, rk, ck, slug);
      if (q) return { question: q, regionRow };
    }
  }

  const { data, error } = await getSupabase()
    .from("questions")
    .select("*")
    .eq("lang", lang)
    .eq("slug", slug);

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

export async function listQuestionsForLang(
  lang: string
): Promise<QuestionRow[]> {
  const { data, error } = await getSupabase()
    .from("questions")
    .select("*")
    .eq("lang", lang)
    .order("created_at", { ascending: false });
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

export type NavQuestionCategory = { slug: string; label: string };

/** Header menüsü: kanonik sıra, yalnızca içerik olan slug’lar */
export const loadNavQuestionCategories = cache(
  async (lang: string): Promise<NavQuestionCategory[]> => {
    if (!isSupabasePublicConfigured()) return [];
    const { data, error } = await getSupabase()
      .from("questions")
      .select("category")
      .eq("lang", lang);
    if (error) {
      logSupabase("loadNavQuestionCategories", error);
      return [];
    }
    const slugSet = new Set<string>();
    for (const row of data ?? []) {
      const raw = (row as { category?: string }).category;
      const c = typeof raw === "string" ? raw.trim() : "";
      if (!c) continue;
      const n = normalizeQuestionCategorySlug(c);
      if (n) slugSet.add(n);
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

  const { data, error } = await getSupabase()
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

  const { data, error } = await getSupabase()
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
