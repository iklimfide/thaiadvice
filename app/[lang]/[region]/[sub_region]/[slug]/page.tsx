import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceDetailContent } from "@/components/content/PlaceDetailContent";
import { QuestionArticleContent } from "@/components/content/QuestionArticleContent";
import { categorySlugForUrl } from "@/lib/data/question-categories";
import {
  getPlaceBySlug,
  getRegionBySlug,
  getSubRegionBySlug,
  listFaqByCategory,
  listQuestionAlternatesForUrl,
  listRelatedPlacesInSubRegion,
  listRelatedQuestionsForArticle,
  resolveArticleDetail,
} from "@/lib/data/queries";
import {
  isQuestionScheduledForPublish,
  masterQuestionVisibility,
} from "@/lib/data/question-visibility";
import type { RegionRow } from "@/lib/types/database";
import { sitePublicImagePathFromQuestionStorageUrl } from "@/lib/format/site-image-url";
import { ogImageAltFromMediaSeo } from "@/lib/format/question-seo";
import { getMasterUser } from "@/lib/admin/auth-server";
import { absoluteUrl, getPublicSiteUrl, pageMetadata } from "@/lib/metadata/site";
import { resolveRouteArg } from "@/lib/next/resolve-route-args";
import { localizedPathAlternates } from "@/lib/seo/language-paths";

export const dynamic = "force-dynamic";

type SlugRouteParams = {
  lang: string;
  region: string;
  sub_region: string;
  slug: string;
};

type Props = {
  params: Promise<SlugRouteParams> | SlugRouteParams;
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
  const raw = await resolveRouteArg(params);
  if (!raw) notFound();
  const lang = raw.lang;
  const regionSlug = raw.region;
  const subSlug = raw.sub_region;
  const slug = raw.slug;
  if (
    typeof lang !== "string" ||
    typeof regionSlug !== "string" ||
    typeof subSlug !== "string" ||
    typeof slug !== "string"
  )
    notFound();

  const master = await getMasterUser();
  const resolved = await resolveArticleDetail(
    lang,
    regionSlug,
    subSlug,
    slug,
    masterQuestionVisibility(master)
  );
  if (resolved) {
    const q = resolved.question;
    const scheduledPreview =
      Boolean(master) && isQuestionScheduledForPublish(q);
    const hasImg = Boolean(q.image_url?.trim());
    const shortImg = hasImg
      ? sitePublicImagePathFromQuestionStorageUrl(q.image_url)
      : null;
    const imageForMeta =
      shortImg != null
        ? absoluteUrl(shortImg)
        : hasImg
          ? q.image_url!.trim()
          : null;
    const cat = categorySlugForUrl(q.category);
    const canonicalPath = `/${lang}/${q.region}/${cat}/${q.slug}`;
    const variants = await listQuestionAlternatesForUrl(
      regionSlug,
      subSlug,
      slug
    );
    const languagePaths: Partial<Record<string, string>> = {};
    for (const row of variants) {
      const c = categorySlugForUrl(row.category);
      languagePaths[row.lang] = `/${row.lang}/${row.region}/${c}/${row.slug}`;
    }
    return pageMetadata({
      title: q.title,
      description:
        q.excerpt?.trim() || metaDescriptionFromIntro(q.content),
      image: imageForMeta,
      imageAlt: hasImg
        ? ogImageAltFromMediaSeo(q.lang, q.media_seo_text)
        : undefined,
      path: canonicalPath,
      locale: lang,
      languagePaths,
      robots: scheduledPreview ? { index: false, follow: false } : undefined,
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
    locale: lang,
    languagePaths: localizedPathAlternates(
      region.slug,
      sub.slug,
      place.slug
    ),
  });
}

/**
 * 1) questions — resolveArticleDetail (region/case/slug yedekleri)
 * 2) places — regions + sub_regions gerekir
 */
export default async function RegionCategorySlugPage({ params }: Props) {
  const raw = await resolveRouteArg(params);
  if (!raw) notFound();
  const lang = raw.lang;
  const regionSlug = raw.region;
  const subSlug = raw.sub_region;
  const slug = raw.slug;
  if (
    typeof lang !== "string" ||
    typeof regionSlug !== "string" ||
    typeof subSlug !== "string" ||
    typeof slug !== "string"
  )
    notFound();

  const master = await getMasterUser();
  const resolved = await resolveArticleDetail(
    lang,
    regionSlug,
    subSlug,
    slug,
    masterQuestionVisibility(master)
  );
  if (resolved) {
    const displayRegion: RegionRow =
      resolved.regionRow ?? virtualRegionFromQuestion(resolved.question);
    const matchingSub = resolved.regionRow
      ? await getSubRegionBySlug(resolved.regionRow.id, subSlug)
      : null;
    const q = resolved.question;
    const scheduledPreview =
      Boolean(master) && isQuestionScheduledForPublish(q);
    const [faq, relatedQuestions] = await Promise.all([
      listFaqByCategory(q.slug),
      listRelatedQuestionsForArticle(
        lang,
        q.id,
        q.category,
        regionSlug,
        resolved.regionRow,
        6
      ),
    ]);
    const siteOrigin = getPublicSiteUrl();
    const articlePath = `/${lang}/${q.region}/${categorySlugForUrl(q.category)}/${q.slug}`;
    const regionBreadcrumbHref =
      resolved.regionRow != null
        ? `/${lang}/${resolved.regionRow.slug}`
        : `/${lang}#regions`;

    let hasEnglishTranslation = false;
    if (lang === "tr" && master) {
      const alternates = await listQuestionAlternatesForUrl(
        regionSlug,
        subSlug,
        slug
      );
      hasEnglishTranslation = alternates.some((row) => row.lang === "en");
    }

    return (
      <QuestionArticleContent
        lang={lang}
        region={displayRegion}
        question={resolved.question}
        matchingSubRegion={matchingSub}
        pagePath={articlePath}
        regionBreadcrumbHref={regionBreadcrumbHref}
        faq={faq}
        relatedQuestions={relatedQuestions}
        siteOrigin={siteOrigin}
        hasEnglishTranslation={hasEnglishTranslation}
        scheduledPreview={scheduledPreview}
      />
    );
  }

  const region = await getRegionBySlug(regionSlug);
  if (!region) notFound();

  const sub = await getSubRegionBySlug(region.id, subSlug);
  if (!sub) notFound();
  const place = await getPlaceBySlug(sub.id, slug);
  if (!place) notFound();
  const [faq, relatedPlaces] = await Promise.all([
    listFaqByCategory(place.slug),
    listRelatedPlacesInSubRegion(sub.id, place.id, 6),
  ]);

  const placePath = `/${lang}/${regionSlug}/${subSlug}/${slug}`;
  return (
    <PlaceDetailContent
      lang={lang}
      region={region}
      sub={sub}
      place={place}
      faq={faq}
      pagePath={placePath}
      relatedPlaces={relatedPlaces}
    />
  );
}
