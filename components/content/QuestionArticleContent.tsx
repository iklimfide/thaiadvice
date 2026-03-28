import { MasterEditable } from "@/components/admin/MasterEditable";
import { ArticleMarkdownBody } from "@/components/content/ArticleMarkdownBody";
import { SafeHeroImageBox } from "@/components/ui/SafeImage";
import { FaqSection } from "@/components/faq/FaqSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CategoryPageLink } from "@/components/ui/CategoryPageLink";
import { categoryLabelForLang } from "@/lib/data/question-categories";
import { displayRegionTitle } from "@/lib/format/display-names";
import { stripQuickAnswerPrefix } from "@/lib/format/faq-display";
import { questionArticleJsonLd } from "@/lib/format/question-seo";
import type { FaqEntryRow } from "@/lib/types/database";
import type { QuestionRow } from "@/lib/types/database";
import type { RegionRow } from "@/lib/types/database";
import type { SubRegionRow } from "@/lib/types/database";

type Props = {
  lang: string;
  region: RegionRow;
  question: QuestionRow;
  matchingSubRegion: SubRegionRow | null;
  /** URL’deki kategori segmenti; breadcrumb ve kategori linki için */
  articleCategorySlug: string;
  /** Breadcrumb JSON-LD ve kısaltılmış satır için geçerli pathname */
  pagePath: string;
  faq: FaqEntryRow[];
};

export function QuestionArticleContent({
  lang,
  region,
  question,
  matchingSubRegion,
  articleCategorySlug,
  pagePath,
  faq,
}: Props) {
  const home = lang === "tr" ? "Ana sayfa" : "Home";
  const categoryLabel = matchingSubRegion
    ? matchingSubRegion.name || matchingSubRegion.slug
    : categoryLabelForLang(question.category, lang);

  const regionLabel = displayRegionTitle(region.name, region.slug, lang);
  const categoryListHref = `/${lang}/${region.slug}/${matchingSubRegion?.slug ?? articleCategorySlug}`;

  const crumbs = [
    { label: home, href: `/${lang}` },
    { label: regionLabel, href: `/${lang}/${region.slug}` },
    { label: categoryLabel, href: categoryListHref },
    { label: question.title },
  ];

  const hasImage = Boolean(question.image_url?.trim());
  const articleJsonLd = questionArticleJsonLd(question, pagePath);

  return (
    <article
      lang={lang === "tr" ? "tr" : "en"}
      className="article-detail mx-auto w-full max-w-3xl px-0 sm:px-1"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Breadcrumbs items={crumbs} pagePath={pagePath} />
      <header className="mb-8 space-y-5 sm:mb-10 sm:space-y-7">
        <p className="flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-wider text-category">
          <MasterEditable
            entity="question"
            id={question.id}
            field="category"
            fieldType="text"
            label="Kategori (veritabanı değeri)"
            initialValue={question.category}
          >
            <CategoryPageLink href={categoryListHref} className="shrink-0">
              {categoryLabelForLang(question.category, lang)}
            </CategoryPageLink>
          </MasterEditable>
          <span aria-hidden>·</span>
          <MasterEditable
            entity="question"
            id={question.id}
            field="author"
            fieldType="text"
            label="Yazar"
            initialValue={question.author}
          >
            <span>{question.author}</span>
          </MasterEditable>
        </p>
        <MasterEditable
          entity="question"
          id={question.id}
          field="title"
          fieldType="text"
          label="Başlık"
          initialValue={question.title}
          wrapClassName=""
        >
          <h1 className="border-b-[3px] border-brand/35 pb-4 font-serif text-2xl font-bold leading-[1.15] tracking-tight text-zinc-900 sm:pb-5 sm:text-4xl sm:leading-tight">
            {question.title}
          </h1>
        </MasterEditable>
        <MasterEditable
          entity="question"
          id={question.id}
          field="excerpt"
          fieldType="textarea"
          label="Özet (excerpt)"
          initialValue={question.excerpt ?? ""}
          wrapClassName=""
        >
          {question.excerpt?.trim() ? (
            <div className="rounded-xl border border-brand/15 bg-gradient-to-br from-brand/[0.06] via-white to-violet-50/40 px-4 py-4 sm:px-5 sm:py-5">
              <p className="article-detail-excerpt text-pretty text-justify text-lg leading-relaxed text-zinc-700">
                {stripQuickAnswerPrefix(question.excerpt)}
              </p>
            </div>
          ) : null}
        </MasterEditable>
        <MasterEditable
          entity="question"
          id={question.id}
          field="media_seo_text"
          fieldType="textarea"
          label="SEO: görsel / alt metin (sayfada gösterilmez)"
          initialValue={question.media_seo_text ?? ""}
        >
          {/* Okuyucuya görünmez; master’da bu alan için “Değiştir” çıkar */}
          <span className="sr-only">SEO medya notu</span>
        </MasterEditable>
      </header>

      <MasterEditable
        entity="question"
        id={question.id}
        field="image_url"
        fieldType="image"
        label="Kapak görseli"
        initialValue={question.image_url ?? ""}
        storageSlug={question.slug}
        hasMedia={hasImage}
        wrapClassName="mt-6 sm:mt-8"
      >
        {hasImage ? (
          <SafeHeroImageBox
            src={question.image_url}
            wrapperClassName="relative mb-6 aspect-[21/9] w-full max-w-3xl overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 shadow-sm sm:mb-8 sm:rounded-xl"
            imageClassName="object-cover"
            sizes="(max-width:768px) 100vw, 768px"
            priority
          />
        ) : null}
      </MasterEditable>

      <MasterEditable
        entity="question"
        id={question.id}
        field="content"
        fieldType="textarea"
        label="İçerik"
        initialValue={question.content}
        wrapClassName="mt-6 w-full max-w-3xl sm:mt-8"
      >
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm ring-1 ring-zinc-100/80 sm:p-8 md:p-10">
          <ArticleMarkdownBody
            markdown={question.content ?? ""}
            className="article-detail-body text-base leading-[1.75] sm:text-[1.0625rem] sm:leading-[1.8]"
          />
        </div>
      </MasterEditable>

      <MasterEditable
        entity="question"
        id={question.id}
        field="region"
        fieldType="text"
        label="Bölge kodu (URL’deki region segmenti)"
        initialValue={question.region}
        wrapClassName="mt-6 text-xs text-zinc-500"
      >
        <p className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-zinc-400">Bölge:</span>
          <CategoryPageLink
            href={`/${lang}/${region.slug}`}
            className="text-sm font-semibold tracking-tight text-category hover:text-brand"
          >
            {displayRegionTitle(region.name, region.slug, lang)}
          </CategoryPageLink>
        </p>
      </MasterEditable>

      <MasterEditable
        entity="question"
        id={question.id}
        field="related_slugs"
        fieldType="related_slugs"
        label="İlişkili slug’lar (virgül veya satır ile ayırın)"
        initialValue={question.related_slugs.join(", ")}
        wrapClassName="mt-10 border-t border-zinc-200 pt-8"
      >
        {question.related_slugs.length > 0 ? (
          <section>
            <h2 className="mb-3 mt-2 border-l-4 border-category bg-category/[0.08] py-2 pl-3 pr-2 font-serif text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
              {lang === "tr" ? "İlişkili slug’lar" : "Related slugs"}
            </h2>
            <ul className="flex flex-wrap gap-2 text-sm">
              {question.related_slugs.map((s) => (
                <li key={s}>
                  <code className="rounded-md bg-violet-50 px-2 py-1 text-category">
                    {s}
                  </code>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </MasterEditable>

      <FaqSection items={faq} detailLayout />
    </article>
  );
}
