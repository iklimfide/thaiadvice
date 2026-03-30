import { Fragment } from "react";
import { MasterEditable } from "@/components/admin/MasterEditable";
import { ArticleMarkdownBody } from "@/components/content/ArticleMarkdownBody";
import { RelatedPlacesBelowDetail } from "@/components/content/RelatedBelowDetail";
import { SafeHeroImageBox } from "@/components/ui/SafeImage";
import { FaqSection } from "@/components/faq/FaqSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { displayRegionTitle } from "@/lib/format/display-names";
import { placeDetailJsonLd } from "@/lib/format/place-seo";
import type {
  FaqEntryRow,
  PlaceRow,
  RegionRow,
  SubRegionRow,
} from "@/lib/types/database";

type Props = {
  lang: string;
  region: RegionRow;
  sub: SubRegionRow;
  place: PlaceRow;
  faq: FaqEntryRow[];
  pagePath: string;
  relatedPlaces?: PlaceRow[];
};

export function PlaceDetailContent({
  lang,
  region,
  sub,
  place,
  faq,
  pagePath,
  relatedPlaces = [],
}: Props) {
  const home = lang === "tr" ? "Ana sayfa" : "Home";
  const regionLabel = displayRegionTitle(region.name, region.slug, lang);
  const crumbs = [
    { label: home, href: `/${lang}` },
    { label: regionLabel, href: `/${lang}/${region.slug}` },
    {
      label: sub.name || sub.slug,
      href: `/${lang}/${region.slug}/${sub.slug}`,
    },
    { label: place.name || place.slug },
  ];

  const hasImage = Boolean(place.image?.trim());
  const placeJsonLd = placeDetailJsonLd({
    place,
    region,
    sub,
    pagePath,
    lang,
  });

  return (
    <Fragment>
    <article
      lang={lang === "tr" ? "tr" : "en"}
      className="article-detail mx-auto w-full max-w-3xl px-0 sm:px-1"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(placeJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumbs items={crumbs} pagePath={pagePath} />
      <header className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <MasterEditable
            entity="place"
            id={place.id}
            field="name"
            fieldType="text"
            label="Mekân adı"
            initialValue={place.name || place.slug}
            wrapClassName="min-w-0 flex-1 sm:flex-none"
          >
            <h1 className="w-full border-b-[3px] border-brand/35 pb-3 font-serif text-2xl font-bold leading-[1.15] tracking-tight text-zinc-900 sm:text-4xl sm:leading-tight">
              {place.name || place.slug}
            </h1>
          </MasterEditable>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <MasterEditable
              entity="place"
              id={place.id}
              field="price_level"
              fieldType="select_price"
              label="Fiyat seviyesi"
              initialValue={place.price_level}
            >
              <span className="rounded-md bg-violet-100 px-2.5 py-1 text-sm font-semibold text-brand-dark">
                {place.price_level}
              </span>
            </MasterEditable>
            <MasterEditable
              entity="place"
              id={place.id}
              field="rating"
              fieldType="rating"
              label="Puan"
              initialValue={String(place.rating)}
            >
              {place.rating > 0 ? (
                <span className="text-sm font-medium text-category">
                  ★ {place.rating}
                </span>
              ) : (
                <span className="text-sm text-zinc-400">★ —</span>
              )}
            </MasterEditable>
          </div>
        </div>
      </header>

      <MasterEditable
        entity="place"
        id={place.id}
        field="image"
        fieldType="image"
        label="Mekân görseli"
        initialValue={place.image ?? ""}
        storageSlug={place.slug}
        hasMedia={hasImage}
        wrapClassName=""
      >
        {hasImage ? (
          <SafeHeroImageBox
            src={place.image}
            wrapperClassName="relative mb-6 aspect-[21/9] w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm sm:mb-8 sm:rounded-xl"
            imageClassName="object-cover"
            sizes="(max-width:1152px) 100vw, 1152px"
            priority
          />
        ) : null}
      </MasterEditable>

      <MasterEditable
        entity="place"
        id={place.id}
        field="ai_intro"
        fieldType="textarea"
        label="Tanıtım metni"
        initialValue={place.ai_intro}
        wrapClassName="w-full max-w-3xl"
      >
        {place.ai_intro?.trim() ? (
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-100/80 sm:p-8 md:p-10">
            <ArticleMarkdownBody
              markdown={place.ai_intro}
              className="article-detail-body text-base leading-[1.75] sm:text-[1.0625rem] sm:leading-[1.8]"
            />
          </div>
        ) : null}
      </MasterEditable>

      <FaqSection items={faq} detailLayout />
    </article>
    <RelatedPlacesBelowDetail
      lang={lang}
      regionSlug={region.slug}
      subRegionSlug={sub.slug}
      places={relatedPlaces}
    />
    </Fragment>
  );
}
