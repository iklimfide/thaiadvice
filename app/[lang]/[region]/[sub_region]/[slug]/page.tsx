import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceDetailContent } from "@/components/content/PlaceDetailContent";
import { QuestionArticleContent } from "@/components/content/QuestionArticleContent";
import {
  getPlaceBySlug,
  getRegionBySlug,
  getSubRegionBySlug,
  listFaqByCategory,
  resolveArticleDetail,
} from "@/lib/data/queries";
import type { RegionRow } from "@/lib/types/database";
import { pageMetadata } from "@/lib/metadata/site";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    lang: string;
    region: string;
    sub_region: string;
    slug: string;
  }>;
};

function metaDescriptionFromIntro(ai: string): string | null {
  const t = ai.trim();
  if (!t) return null;
  return t.length > 160 ? `${t.slice(0, 157)}…` : t;
}

function virtualRegionFromQuestion(q: { region: string }): RegionRow {
  return {
    id: q.region,
    slug: q.region,
    name: q.region,
    description: "",
    image: "",
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, region: regionSlug, sub_region: subSlug, slug } =
    await params;

  const resolved = await resolveArticleDetail(
    lang,
    regionSlug,
    subSlug,
    slug
  );
  if (resolved) {
    const q = resolved.question;
    const hasImg = Boolean(q.image_url?.trim());
    return pageMetadata({
      title: q.title,
      description:
        q.excerpt?.trim() || metaDescriptionFromIntro(q.content),
      image: hasImg ? q.image_url : null,
      path: `/${lang}/${regionSlug}/${subSlug}/${slug}`,
    });
  }

  const region = await getRegionBySlug(regionSlug);
  if (!region) return { title: "Bulunamadı" };

  const sub = await getSubRegionBySlug(region.id, subSlug);
  if (!sub) return { title: "Bulunamadı" };
  const place = await getPlaceBySlug(sub.id, slug);
  if (!place) return { title: "Bulunamadı" };
  const hasImage = Boolean(place.image?.trim());
  return pageMetadata({
    title: place.name || place.slug,
    description: metaDescriptionFromIntro(place.ai_intro),
    image: hasImage ? place.image : null,
    path: `/${lang}/${region.slug}/${sub.slug}/${place.slug}`,
  });
}

/**
 * 1) questions — resolveArticleDetail (region/case/slug yedekleri)
 * 2) places — regions + sub_regions gerekir
 */
export default async function RegionCategorySlugPage({ params }: Props) {
  const { lang, region: regionSlug, sub_region: subSlug, slug } =
    await params;

  const resolved = await resolveArticleDetail(
    lang,
    regionSlug,
    subSlug,
    slug
  );
  if (resolved) {
    const displayRegion: RegionRow =
      resolved.regionRow ?? virtualRegionFromQuestion(resolved.question);
    const matchingSub = resolved.regionRow
      ? await getSubRegionBySlug(resolved.regionRow.id, subSlug)
      : null;
    const faq = await listFaqByCategory(resolved.question.slug);

    const articlePath = `/${lang}/${regionSlug}/${subSlug}/${slug}`;
    return (
      <QuestionArticleContent
        lang={lang}
        region={displayRegion}
        question={resolved.question}
        matchingSubRegion={matchingSub}
        articleCategorySlug={subSlug}
        pagePath={articlePath}
        faq={faq}
      />
    );
  }

  const region = await getRegionBySlug(regionSlug);
  if (!region) notFound();

  const sub = await getSubRegionBySlug(region.id, subSlug);
  if (!sub) notFound();
  const place = await getPlaceBySlug(sub.id, slug);
  if (!place) notFound();
  const faq = await listFaqByCategory(place.slug);

  const placePath = `/${lang}/${regionSlug}/${subSlug}/${slug}`;
  return (
    <PlaceDetailContent
      lang={lang}
      region={region}
      sub={sub}
      place={place}
      faq={faq}
      pagePath={placePath}
    />
  );
}
