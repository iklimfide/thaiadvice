import type { MetadataRoute } from "next";
import {
  categorySlugForUrl,
  normalizeQuestionCategorySlug,
} from "@/lib/data/question-categories";
import {
  listPlacesForSubRegion,
  listQuestionsForLang,
  listSubRegionsForRegion,
  loadRegionsFromSupabase,
} from "@/lib/data/queries";
import type { QuestionRow } from "@/lib/types/database";
import { getPublicSiteUrl } from "@/lib/metadata/site";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { DEFAULT_SITE_LANG, SITE_LANGS } from "@/lib/seo/site-languages";

/** Sitemap ve arama motorları için makul tazelik; sunucu yükünü sınırlar */
export const revalidate = 3600;

function originBase(): string {
  return getPublicSiteUrl().replace(/\/$/, "");
}

function languageAlternates(
  base: string,
  relByLang: Record<string, string>
): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const [code, rel] of Object.entries(relByLang)) {
    const r = rel.startsWith("/") ? rel : `/${rel}`;
    languages[code] = `${base}${r}`;
  }
  const xDef =
    languages[DEFAULT_SITE_LANG] ??
    languages[Object.keys(languages).sort()[0] ?? ""];
  if (xDef) languages["x-default"] = xDef;
  return { languages };
}

function relPathsForRest(rest: string): Record<string, string> {
  const tail = rest.replace(/^\/+|\/+$/g, "");
  return Object.fromEntries(
    SITE_LANGS.map((l) => [l, tail ? `/${l}/${tail}` : `/${l}`])
  );
}

function questionGroupKey(q: QuestionRow): string {
  const nr = q.region.toLowerCase();
  const nc = (
    normalizeQuestionCategorySlug(q.category) ?? q.category
  ).toLowerCase();
  return `${nr}|${nc}|${q.slug}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = originBase();
  const now = new Date();
  const seen = new Set<string>();

  const out: MetadataRoute.Sitemap = [];

  const pushEntry = (
    path: string,
    relByLang: Record<string, string>,
    opts?: {
      changeFrequency?: MetadataRoute.Sitemap[0]["changeFrequency"];
      priority?: number;
    }
  ) => {
    const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
    if (seen.has(url)) return;
    seen.add(url);
    const { changeFrequency = "weekly", priority = 0.7 } = opts ?? {};
    out.push({
      url,
      lastModified: now,
      changeFrequency,
      priority,
      alternates: languageAlternates(base, relByLang),
    });
  };

  const rootAlts = languageAlternates(base, { tr: "/tr", en: "/en" });
  const rootUrl = `${base}/`;
  if (!seen.has(rootUrl)) {
    seen.add(rootUrl);
    out.push({
      url: rootUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
      alternates: rootAlts,
    });
  }

  for (const lang of SITE_LANGS) {
    pushEntry(`/${lang}`, relPathsForRest(""), {
      changeFrequency: "daily",
      priority: 0.95,
    });
  }

  if (!isSupabasePublicConfigured()) {
    return out;
  }

  const { regions } = await loadRegionsFromSupabase();

  for (const region of regions) {
    for (const lang of SITE_LANGS) {
      pushEntry(
        `/${lang}/${region.slug}`,
        relPathsForRest(region.slug),
        { changeFrequency: "weekly", priority: 0.85 }
      );
    }
    const subs = await listSubRegionsForRegion(region.id);
    for (const sub of subs) {
      const rest = `${region.slug}/${sub.slug}`;
      for (const lang of SITE_LANGS) {
        pushEntry(`/${lang}/${rest}`, relPathsForRest(rest), {
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
      const places = await listPlacesForSubRegion(sub.id);
      for (const place of places) {
        const prest = `${region.slug}/${sub.slug}/${place.slug}`;
        for (const lang of SITE_LANGS) {
          pushEntry(`/${lang}/${prest}`, relPathsForRest(prest), {
            changeFrequency: "monthly",
            priority: 0.65,
          });
        }
      }
    }
  }

  const allQuestions = (
    await Promise.all(SITE_LANGS.map((l) => listQuestionsForLang(l)))
  ).flat();

  const groups = new Map<string, QuestionRow[]>();
  for (const q of allQuestions) {
    const k = questionGroupKey(q);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(q);
  }

  for (const q of allQuestions) {
    const k = questionGroupKey(q);
    const group = groups.get(k) ?? [q];
    const cat = categorySlugForUrl(q.category);
    const path = `/${q.lang}/${q.region}/${cat}/${q.slug}`;
    const url = `${base}${path}`;
    if (seen.has(url)) continue;
    seen.add(url);
    const relByLang: Record<string, string> = {};
    for (const s of group) {
      const c = categorySlugForUrl(s.category);
      relByLang[s.lang] = `/${s.lang}/${s.region}/${c}/${s.slug}`;
    }
    out.push({
      url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
      alternates: languageAlternates(base, relByLang),
    });
  }

  return out;
}
