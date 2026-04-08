import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MasterAddSubRegion } from "@/components/admin/MasterAddSubRegion";
import { SubRegionCard } from "@/components/cards/SubRegionCard";
import { RegionPageMasterHeader } from "@/components/content/RegionPageMasterHeader";
import { FaqSection } from "@/components/faq/FaqSection";
import { PostCard } from "@/components/home/PostCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getMasterUser } from "@/lib/admin/auth-server";
import {
  fetchEnglishQuestionTranslationKeys,
  getRegionBySlug,
  listFaqByCategory,
  listQuestionsForLang,
  listSubRegionsForRegion,
} from "@/lib/data/queries";
import { sortTurkishQuestionsWithMissingEnglishFirst } from "@/lib/data/question-translation";
import { masterQuestionVisibility } from "@/lib/data/question-visibility";
import { displayRegionTitle } from "@/lib/format/display-names";
import { pageMetadata } from "@/lib/metadata/site";
import { resolveRouteArg } from "@/lib/next/resolve-route-args";
import { localizedPathAlternates } from "@/lib/seo/language-paths";

export const dynamic = "force-dynamic";

type Props = {
  params:
    | Promise<{ lang: string; region: string }>
    | { lang: string; region: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await resolveRouteArg(params);
  if (!p || typeof p.lang !== "string" || typeof p.region !== "string")
    notFound();
  const { lang, region: regionSlug } = p;
  const region = await getRegionBySlug(regionSlug);
  if (!region) return { title: "Bulunamadı" };
  const hasImage = Boolean(region.image?.trim());
  const regionTitle = displayRegionTitle(region.name, region.slug, lang);
  return pageMetadata({
    title: regionTitle,
    description: region.description?.trim() || null,
    image: hasImage ? region.image : null,
    path: `/${lang}/${region.slug}`,
    locale: lang,
    languagePaths: localizedPathAlternates(region.slug),
  });
}

export default async function RegionPage({ params }: Props) {
  const p = await resolveRouteArg(params);
  if (!p || typeof p.lang !== "string" || typeof p.region !== "string")
    notFound();
  const { lang, region: regionSlug } = p;
  const region = await getRegionBySlug(regionSlug);
  if (!region) notFound();

  const master = await getMasterUser();
  const needsEnSort = Boolean(master) && lang === "tr";
  const [subs, faq, regionQuestions, enKeys] = await Promise.all([
    listSubRegionsForRegion(region.id),
    listFaqByCategory(region.slug),
    listQuestionsForLang(lang, {
      ...masterQuestionVisibility(master),
      regionSlug: region.slug,
    }),
    needsEnSort
      ? fetchEnglishQuestionTranslationKeys()
      : Promise.resolve(null as Set<string> | null),
  ]);
  const displayRegionQuestions =
    needsEnSort && enKeys
      ? sortTurkishQuestionsWithMissingEnglishFirst(regionQuestions, enKeys)
      : regionQuestions;

  const home = lang === "tr" ? "Ana sayfa" : "Home";
  const regionTitle = displayRegionTitle(region.name, region.slug, lang);
  const crumbs = [
    { label: home, href: `/${lang}` },
    { label: regionTitle },
  ];

  const subsTitle = lang === "tr" ? "Alt bölgeler" : "Sub-regions";
  const emptySubs = lang === "tr" ? "Kayıt yok." : "No entries.";
  const questionsTitle =
    lang === "tr" ? "Bu bölgeye ait içerikler" : "Content for this destination";
  const emptyQuestions =
    lang === "tr"
      ? "Bu bölge için henüz soru / makale yok."
      : "No posts for this destination yet.";

  return (
    <div>
      <Breadcrumbs
        items={crumbs}
        pagePath={`/${lang}/${regionSlug}`}
      />
      <RegionPageMasterHeader lang={lang} region={region} />

      <section className="mb-10" aria-labelledby="region-questions-heading">
        <h2 id="region-questions-heading" className="sr-only">
          {questionsTitle}
        </h2>
        <SectionTitle className="mb-4">{questionsTitle}</SectionTitle>
        {displayRegionQuestions.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">{emptyQuestions}</p>
        ) : (
          <ul className="mx-auto grid w-full max-w-xl grid-cols-1 gap-8 md:max-w-none md:grid-cols-2 md:gap-8 xl:grid-cols-3">
            {displayRegionQuestions.map((q) => (
              <li key={q.id} className="min-w-0">
                <PostCard lang={lang} question={q} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <SectionTitle className="mb-0 sm:flex-1">{subsTitle}</SectionTitle>
          <MasterAddSubRegion regionId={region.id} lang={lang} />
        </div>
        {subs.length === 0 ? (
          <p className="text-sm text-zinc-500">{emptySubs}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 xl:grid-cols-3">
            {subs.map((s) => (
              <SubRegionCard
                key={s.id}
                lang={lang}
                regionSlug={region.slug}
                sub={s}
              />
            ))}
          </div>
        )}
      </section>

      <FaqSection items={faq} />
    </div>
  );
}
