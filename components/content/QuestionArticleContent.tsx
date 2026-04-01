import { Fragment } from "react";
import { MasterEditable } from "@/components/admin/MasterEditable";
import { MasterTranslateBar } from "@/components/admin/MasterTranslateBar";
import { ArticleShareFooter } from "@/components/content/ArticleShareFooter";
import { ArticleMarkdownBody } from "@/components/content/ArticleMarkdownBody";
import { RelatedArticlesBelowDetail } from "@/components/content/RelatedBelowDetail";
import { SafeHeroImageBox } from "@/components/ui/SafeImage";
import { FaqSection } from "@/components/faq/FaqSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CategoryPageLink } from "@/components/ui/CategoryPageLink";
import {
  categoryLabelForLang,
  categorySlugForUrl,
} from "@/lib/data/question-categories";
import { formatPostDate } from "@/lib/format/date";
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
  /** Breadcrumb JSON-LD ve kısaltılmış satır için geçerli pathname */
  pagePath: string;
  /** Bölge kırıntısı: DB’de regions satırı yoksa topbar’daki Bölgeler gibi ana sayfa */
  regionBreadcrumbHref?: string;
  faq: FaqEntryRow[];
  relatedQuestions?: QuestionRow[];
  siteOrigin: string;
  /** Master çeviri: aynı slug için lang=en satırı var mı (tekrar çeviri uyarısı) */
  hasEnglishTranslation?: boolean;
  /** Master: yayın tarihi gelecekte — ziyaretçilere kapalı önizleme */
  scheduledPreview?: boolean;
};

export function QuestionArticleContent({
  lang,
  region,
  question,
  matchingSubRegion,
  pagePath,
  regionBreadcrumbHref,
  faq,
  relatedQuestions = [],
  siteOrigin,
  hasEnglishTranslation = false,
  scheduledPreview = false,
}: Props) {
  const home = lang === "tr" ? "Ana sayfa" : "Home";
  const categoryLabel = matchingSubRegion
    ? matchingSubRegion.name || matchingSubRegion.slug
    : categoryLabelForLang(question.category, lang);

  const regionLabel = displayRegionTitle(region.name, region.slug, lang);
  const regionCrumbHref =
    regionBreadcrumbHref ?? `/${lang}/${region.slug}`;
  /** URL’deki segment gerçek alt bölge değilse (makale kategorisi) liste sayfası yok — topbar Kategoriler ile aynı */
  const categoryListHref = matchingSubRegion
    ? `/${lang}/${region.slug}/${matchingSubRegion.slug}`
    : `/${lang}?category=${encodeURIComponent(categorySlugForUrl(question.category))}#latest-posts`;

  const crumbs = [
    { label: home, href: `/${lang}` },
    { label: regionLabel, href: regionCrumbHref },
    { label: categoryLabel, href: categoryListHref },
    { label: question.title },
  ];

  const hasImage = Boolean(question.image_url?.trim());
  const publishedStr = formatPostDate(question.created_at, lang);
  const articleJsonLd = questionArticleJsonLd(question, pagePath);
  const shareUrl = `${siteOrigin.replace(/\/$/, "")}${pagePath.startsWith("/") ? pagePath : `/${pagePath}`}`;

  return (
    <Fragment>
    <article
      lang={lang === "tr" ? "tr" : "en"}
      className="article-detail mx-auto w-full max-w-3xl px-0 sm:px-1"
    >
      {!scheduledPreview ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <Breadcrumbs items={crumbs} pagePath={pagePath} />
      <MasterTranslateBar
        questionId={question.id}
        lang={lang}
        pathname={pagePath}
        hasEnglishTranslation={hasEnglishTranslation}
      />
      {scheduledPreview ? (
        <div
          role="status"
          className="mb-6 rounded-lg border border-amber-200/90 bg-amber-50/95 px-4 py-3.5 text-sm leading-snug text-amber-950"
        >
          {lang === "tr" ? (
            <>
              <strong>Zamanlanmış yayın.</strong> Bu makale henüz herkese açık
              değil; yalnızca siz görüyorsunuz. Yayın tarihi:{" "}
              <time dateTime={question.created_at}>{publishedStr}</time>.
            </>
          ) : (
            <>
              <strong>Scheduled.</strong> This article is not public yet. Goes
              live on{" "}
              <time dateTime={question.created_at}>{publishedStr}</time>.
            </>
          )}
        </div>
      ) : null}
      {question.is_hidden ? (
        <div
          role="status"
          className="mb-6 rounded-lg bg-violet-100/95 px-4 py-3.5 text-sm leading-snug text-violet-950"
        >
          <span className="font-semibold">
            {lang === "tr" ? "Gizli makale" : "Hidden article"}
          </span>
          <span className="text-violet-900/85">
            {" — "}
            {lang === "tr"
              ? "Ziyaretçiler ana sayfada ve menüde görmez; doğrudan bağlantı da onlar için yok. Yalnızca master oturumunda bu sayfa açılır."
              : "Hidden from home and navigation; visitors get not-found on the public URL. Only a master session can open this page."}
          </span>
        </div>
      ) : null}
      <header className="mb-8 space-y-5 sm:mb-10 sm:space-y-7">
        <div className="flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-wider text-category">
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
          <span aria-hidden className="font-normal text-zinc-400">
            ·
          </span>
          <MasterEditable
            entity="question"
            id={question.id}
            field="created_at"
            fieldType="datetime_local"
            label="Yayın tarihi"
            initialValue={question.created_at}
          >
            <span className="font-normal normal-case tracking-normal text-zinc-500">
              {publishedStr || (lang === "tr" ? "Tarih yok" : "No date")}
            </span>
          </MasterEditable>
        </div>
        <MasterEditable
          entity="question"
          id={question.id}
          field="title"
          fieldType="text"
          label="Başlık"
          initialValue={question.title}
          wrapClassName=""
          showQuestionVisibilityToggle
          questionIsHidden={question.is_hidden}
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
            alt={question.title}
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

      <ArticleShareFooter
        shareUrl={shareUrl}
        title={question.title}
        lang={lang}
        articleId={question.id}
        className="w-full max-w-3xl"
      />

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
    <RelatedArticlesBelowDetail lang={lang} questions={relatedQuestions} />
    </Fragment>
  );
}
