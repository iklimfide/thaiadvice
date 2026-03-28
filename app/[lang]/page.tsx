import type { Metadata } from "next";
import { ArticleSubmissionForm } from "@/components/forms/ArticleSubmissionForm";
import { PostCard } from "@/components/home/PostCard";
import { HomeQuestionSearch } from "@/components/home/HomeQuestionSearch";
import { RibbonHeading } from "@/components/home/RibbonHeading";
import { RegionsListing } from "@/components/home/RegionsListing";
import { filterQuestionsByTextQuery } from "@/lib/data/question-search";
import {
  listQuestionsForLang,
  loadRegionsFromSupabase,
} from "@/lib/data/queries";
import {
  categoryLabelForLang,
  normalizeQuestionCategorySlug,
} from "@/lib/data/question-categories";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { getPublicSiteUrl, pageMetadata } from "@/lib/metadata/site";
import { SITE_LANGS } from "@/lib/seo/site-languages";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ category?: string | string[]; q?: string | string[] }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { lang } = await params;
  const sp = await searchParams;
  const raw = sp.category;
  const cat =
    typeof raw === "string"
      ? raw.trim()
      : Array.isArray(raw)
        ? (raw[0] ?? "").trim()
        : "";
  const titleBase =
    lang === "tr" ? "Tayland rehberi" : "Thailand guide";
  const catLabel = cat ? categoryLabelForLang(cat, lang) : "";
  const catSlug = cat ? normalizeQuestionCategorySlug(cat) : null;
  const title = cat ? `${titleBase} — ${catLabel}` : titleBase;
  const path =
    cat.length > 0
      ? `/${lang}?category=${encodeURIComponent(catSlug ?? cat)}`
      : `/${lang}`;
  const languagePaths: Partial<Record<string, string>> = {};
  for (const l of SITE_LANGS) {
    languagePaths[l] =
      cat.length > 0
        ? `/${l}?category=${encodeURIComponent(catSlug ?? cat)}`
        : `/${l}`;
  }
  return pageMetadata({
    title,
    description:
      "Tayland seyahat ipuçları, destinasyonlar ve güncel içerikler.",
    image: null,
    path,
    locale: lang,
    languagePaths,
  });
}

export default async function LangHome({ params, searchParams }: Props) {
  const { lang } = await params;
  const sp = await searchParams;
  const rawCat = sp.category;
  const categoryFilter =
    typeof rawCat === "string"
      ? rawCat.trim()
      : Array.isArray(rawCat)
        ? (rawCat[0] ?? "").trim()
        : "";
  const rawQ = sp.q;
  const searchQuery =
    typeof rawQ === "string"
      ? rawQ
      : Array.isArray(rawQ)
        ? (rawQ[0] ?? "")
        : "";

  const [{ regions, error: regionsError }, allQuestions] = await Promise.all([
    loadRegionsFromSupabase(),
    listQuestionsForLang(lang),
  ]);
  const filterCanon =
    categoryFilter.length > 0
      ? normalizeQuestionCategorySlug(categoryFilter)
      : null;
  const unknownCategoryFilter =
    categoryFilter.length > 0 && filterCanon == null;

  const afterCategory = unknownCategoryFilter
    ? []
    : filterCanon != null
      ? allQuestions.filter(
          (q) => normalizeQuestionCategorySlug(q.category) === filterCanon
        )
      : allQuestions;

  const questions = filterQuestionsByTextQuery(
    afterCategory,
    searchQuery,
    lang
  );
  const siteOrigin = getPublicSiteUrl();
  const searchTrimmed = searchQuery.trim();
  const categoryHiddenValue =
    filterCanon != null
      ? filterCanon
      : categoryFilter.length > 0
        ? categoryFilter
        : null;

  const filterHeadingLabel = categoryFilter.length
    ? categoryLabelForLang(categoryFilter, lang)
    : "";

  const latestLabel =
    categoryFilter.length > 0
      ? lang === "tr"
        ? `Son içerikler — ${filterHeadingLabel}`
        : `Latest — ${filterHeadingLabel}`
      : lang === "tr"
        ? "Son içerikler"
        : "Latest posts";

  return (
    <div className="space-y-12 sm:space-y-16">
      <SiteJsonLd lang={lang} />
      <section id="latest-posts" aria-labelledby="latest-posts-heading">
        <h2 id="latest-posts-heading" className="sr-only">
          {latestLabel}
        </h2>

        <HomeQuestionSearch
          lang={lang}
          initialQuery={searchQuery}
          categoryValue={categoryHiddenValue}
        />

        {questions.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">
            {unknownCategoryFilter
              ? lang === "tr"
                ? "Geçersiz kategori."
                : "Invalid category."
              : searchTrimmed.length > 0 && afterCategory.length > 0
                ? lang === "tr"
                  ? "Aramanızla eşleşen içerik yok."
                  : "No posts match your search."
              : categoryFilter.length > 0
                ? lang === "tr"
                  ? "Bu kategoride içerik yok."
                  : "No posts in this category."
                : lang === "tr"
                  ? "Bu dil için henüz içerik yok."
                  : "No posts for this language yet."}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
            {questions.map((q) => (
              <li key={q.id} className="min-w-0">
                <PostCard
                  lang={lang}
                  question={q}
                  siteOrigin={siteOrigin}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="regions" aria-labelledby="regions-heading">
        <RibbonHeading>
          {lang === "tr" ? "Destinasyonlar" : "Destinations"}
        </RibbonHeading>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="regions-heading" className="sr-only">
            {lang === "tr" ? "Tayland bölgeleri" : "Thailand regions"}
          </h2>
          {regions.length > 0 && !regionsError ? (
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              {regions.length}{" "}
              {lang === "tr" ? "bölge" : "regions"}
            </span>
          ) : null}
        </div>
        <RegionsListing
          lang={lang}
          regions={regions}
          loadError={regionsError}
        />
      </section>

      <section id="oneri" className="pb-8">
        <RibbonHeading>
          {lang === "tr" ? "İçerik önerisi" : "Suggest content"}
        </RibbonHeading>
        <ArticleSubmissionForm lang={lang} />
      </section>
    </div>
  );
}
