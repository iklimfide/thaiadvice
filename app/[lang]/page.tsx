import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleSubmissionForm } from "@/components/forms/ArticleSubmissionForm";
import { PostCard } from "@/components/home/PostCard";
import { HomeQuestionSearch } from "@/components/home/HomeQuestionSearch";
import { RibbonHeading } from "@/components/home/RibbonHeading";
import { RegionsListing } from "@/components/home/RegionsListing";
import { filterQuestionsByTextQuery } from "@/lib/data/question-search";
import {
  fetchEnglishQuestionTranslationKeys,
  listQuestionsForLang,
  loadRegionsFromSupabase,
} from "@/lib/data/queries";
import { masterQuestionVisibility } from "@/lib/data/question-visibility";
import { sortTurkishQuestionsWithMissingEnglishFirst } from "@/lib/data/question-translation";
import {
  categoryLabelForLang,
  normalizeQuestionCategorySlug,
} from "@/lib/data/question-categories";
import type { QuestionRow } from "@/lib/types/database";
import { getMasterUser } from "@/lib/admin/auth-server";
import { SiteJsonLd } from "@/components/seo/SiteJsonLd";
import { pageMetadata } from "@/lib/metadata/site";
import { resolveRouteArg } from "@/lib/next/resolve-route-args";
import { SITE_LANGS } from "@/lib/seo/site-languages";
import { questionTranslationKey } from "@/lib/data/question-translation";

export const dynamic = "force-dynamic";

/** Menüden erişilen kurumsal “kimdir” sayfası; yalnızca “tüm kategoriler” akışında gizlenir */
function excludeCorporateAboutFromLatestGrid(questions: QuestionRow[]): QuestionRow[] {
  return questions.filter((q) => {
    const cat = normalizeQuestionCategorySlug(q.category);
    const isHub =
      q.slug === "arif-guvenc-kimdir" &&
      q.region.trim().toLowerCase() === "genel" &&
      cat === "kurumsal";
    return !isHub;
  });
}

type Props = {
  params: Promise<{ lang: string }> | { lang: string };
  searchParams?:
    | Promise<{ category?: string | string[]; q?: string | string[] }>
    | { category?: string | string[]; q?: string | string[] };
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const p = await resolveRouteArg(params);
  if (!p || typeof p.lang !== "string") notFound();
  const { lang } = p;
  const sp = (await Promise.resolve(searchParams)) ?? {};
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
  const p = await resolveRouteArg(params);
  if (!p || typeof p.lang !== "string") notFound();
  const { lang } = p;
  const sp = (await Promise.resolve(searchParams)) ?? {};
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

  const master = await getMasterUser();
  const needsEnSort = Boolean(master) && lang === "tr";
  const [{ regions, error: regionsError }, rawQuestions, enKeys] =
    await Promise.all([
      loadRegionsFromSupabase(),
      listQuestionsForLang(lang, masterQuestionVisibility(master)),
      needsEnSort
        ? fetchEnglishQuestionTranslationKeys()
        : Promise.resolve(null as Set<string> | null),
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
      ? rawQuestions.filter(
          (q) => normalizeQuestionCategorySlug(q.category) === filterCanon
        )
      : rawQuestions;

  const forListing =
    filterCanon == null && !unknownCategoryFilter
      ? excludeCorporateAboutFromLatestGrid(afterCategory)
      : afterCategory;

  const forListingSorted =
    needsEnSort && enKeys
      ? sortTurkishQuestionsWithMissingEnglishFirst(forListing, enKeys)
      : forListing;

  const questions = filterQuestionsByTextQuery(
    forListingSorted,
    searchQuery,
    lang
  );
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
    <>
      <SiteJsonLd lang={lang} />
      <div className="space-y-12 sm:space-y-16">
        <section id="latest-posts" aria-labelledby="latest-posts-heading">
          <h2 id="latest-posts-heading" className="sr-only">
            {latestLabel}
          </h2>

          <div className="mx-auto w-full max-w-xl">
            <HomeQuestionSearch
              lang={lang}
              initialQuery={searchQuery}
              categoryValue={categoryHiddenValue}
            />
          </div>

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
            <ul className="mx-auto grid w-full max-w-xl grid-cols-1 gap-8 md:max-w-none md:grid-cols-2 md:gap-8 xl:grid-cols-3">
              {questions.map((q) => (
                <li key={q.id} className="min-w-0">
                  <PostCard
                    lang={lang}
                    question={q}
                    missingEnglishTranslation={
                      needsEnSort && enKeys
                        ? !enKeys.has(questionTranslationKey(q))
                        : false
                    }
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
    </>
  );
}
