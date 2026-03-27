import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { SubRegionPageMasterHeader } from "@/components/content/SubRegionPageMasterHeader";
import { FaqSection } from "@/components/faq/FaqSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  getRegionBySlug,
  getSubRegionBySlug,
  listFaqByCategory,
  listPlacesForSubRegion,
} from "@/lib/data/queries";
import { displayRegionTitle } from "@/lib/format/display-names";
import { pageMetadata } from "@/lib/metadata/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string; region: string; sub_region: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, region: regionSlug, sub_region: subSlug } = await params;
  const region = await getRegionBySlug(regionSlug);
  if (!region) return { title: "Bulunamadı" };
  const sub = await getSubRegionBySlug(region.id, subSlug);
  if (!sub) return { title: "Bulunamadı" };
  const hasSubImage = Boolean(sub.image?.trim());
  return pageMetadata({
    title: sub.name || sub.slug,
    description: sub.description?.trim() || null,
    image: hasSubImage ? sub.image : null,
    path: `/${lang}/${region.slug}/${sub.slug}`,
  });
}

export default async function SubRegionPage({ params }: Props) {
  const { lang, region: regionSlug, sub_region: subSlug } = await params;
  const region = await getRegionBySlug(regionSlug);
  if (!region) notFound();
  const sub = await getSubRegionBySlug(region.id, subSlug);
  if (!sub) notFound();

  const [places, faq] = await Promise.all([
    listPlacesForSubRegion(sub.id),
    listFaqByCategory(sub.slug),
  ]);

  const home = lang === "tr" ? "Ana sayfa" : "Home";
  const regionLabel = displayRegionTitle(region.name, region.slug, lang);
  const crumbs = [
    { label: home, href: `/${lang}` },
    { label: regionLabel, href: `/${lang}/${region.slug}` },
    { label: sub.name || sub.slug },
  ];

  const placesTitle = lang === "tr" ? "Mekanlar" : "Places";
  const emptyPlaces = lang === "tr" ? "Kayıt yok." : "No entries.";

  return (
    <div>
      <Breadcrumbs
        items={crumbs}
        pagePath={`/${lang}/${regionSlug}/${subSlug}`}
      />
      <SubRegionPageMasterHeader sub={sub} />

      <section className="mb-10">
        <SectionTitle>{placesTitle}</SectionTitle>
        {places.length === 0 ? (
          <p className="text-sm text-zinc-500">{emptyPlaces}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8 xl:grid-cols-3">
            {places.map((p) => (
              <PlaceCard
                key={p.id}
                lang={lang}
                regionSlug={region.slug}
                subRegionSlug={sub.slug}
                place={p}
              />
            ))}
          </div>
        )}
      </section>

      <FaqSection items={faq} />
    </div>
  );
}
