import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubRegionCard } from "@/components/cards/SubRegionCard";
import { FaqSection } from "@/components/faq/FaqSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  getRegionBySlug,
  listFaqByCategory,
  listSubRegionsForRegion,
} from "@/lib/data/queries";
import { pageMetadata } from "@/lib/metadata/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string; region: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, region: regionSlug } = await params;
  const region = await getRegionBySlug(regionSlug);
  if (!region) return { title: "Bulunamadı" };
  const hasImage = Boolean(region.image?.trim());
  return pageMetadata({
    title: region.name || region.slug,
    description: region.description?.trim() || null,
    image: hasImage ? region.image : null,
    path: `/${lang}/${region.slug}`,
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
  const crumbs = [
    { label: home, href: `/${lang}` },
    { label: region.name || region.slug },
  ];

  const subsTitle = lang === "tr" ? "Alt bölgeler" : "Sub-regions";
  const emptySubs = lang === "tr" ? "Kayıt yok." : "No entries.";

  return (
    <div>
      <Breadcrumbs items={crumbs} />
      <header className="mb-8 border-b border-zinc-200 pb-8">
        <h1 className="font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">
          {region.name || region.slug}
        </h1>
        {region.description?.trim() ? (
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-zinc-600">
            {region.description}
          </p>
        ) : null}
      </header>

      <section className="mb-10">
        <SectionTitle>{subsTitle}</SectionTitle>
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
