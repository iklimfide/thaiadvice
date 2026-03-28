import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MasterAddSubRegion } from "@/components/admin/MasterAddSubRegion";
import { SubRegionCard } from "@/components/cards/SubRegionCard";
import { RegionPageMasterHeader } from "@/components/content/RegionPageMasterHeader";
import { FaqSection } from "@/components/faq/FaqSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  getRegionBySlug,
  listFaqByCategory,
  listSubRegionsForRegion,
} from "@/lib/data/queries";
import { displayRegionTitle } from "@/lib/format/display-names";
import { pageMetadata } from "@/lib/metadata/site";
import { localizedPathAlternates } from "@/lib/seo/language-paths";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string; region: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, region: regionSlug } = await params;
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
  const { lang, region: regionSlug } = await params;
  const region = await getRegionBySlug(regionSlug);
  if (!region) notFound();

  const [subs, faq] = await Promise.all([
    listSubRegionsForRegion(region.id),
    listFaqByCategory(region.slug),
  ]);

  const home = lang === "tr" ? "Ana sayfa" : "Home";
  const regionTitle = displayRegionTitle(region.name, region.slug, lang);
  const crumbs = [
    { label: home, href: `/${lang}` },
    { label: regionTitle },
  ];

  const subsTitle = lang === "tr" ? "Alt bölgeler" : "Sub-regions";
  const emptySubs = lang === "tr" ? "Kayıt yok." : "No entries.";

  return (
    <div>
      <Breadcrumbs
        items={crumbs}
        pagePath={`/${lang}/${regionSlug}`}
      />
      <RegionPageMasterHeader lang={lang} region={region} />

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
