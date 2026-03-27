import { MasterEditable } from "@/components/admin/MasterEditable";
import { ArticleMarkdownBody } from "@/components/content/ArticleMarkdownBody";
import { SafeHeroImageBox } from "@/components/ui/SafeImage";
import { FaqSection } from "@/components/faq/FaqSection";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { categoryLabelForLang } from "@/lib/data/question-categories";
import type { FaqEntryRow } from "@/lib/types/database";
import type { QuestionRow } from "@/lib/types/database";
import type { RegionRow } from "@/lib/types/database";
import type { SubRegionRow } from "@/lib/types/database";

type Props = {
  lang: string;
  region: RegionRow;
  question: QuestionRow;
  matchingSubRegion: SubRegionRow | null;
  faq: FaqEntryRow[];
};

export function QuestionArticleContent({
  lang,
  region,
  question,
  matchingSubRegion,
  faq,
}: Props) {
  const home = lang === "tr" ? "Ana sayfa" : "Home";
  const categoryLabel = matchingSubRegion
    ? matchingSubRegion.name || matchingSubRegion.slug
    : categoryLabelForLang(question.category, lang);

  const crumbs = [
    { label: home, href: `/${lang}` },
    { label: region.name || region.slug, href: `/${lang}/${region.slug}` },
    matchingSubRegion
      ? {
          label: categoryLabel,
          href: `/${lang}/${region.slug}/${matchingSubRegion.slug}`,
        }
      : { label: categoryLabel },
    { label: question.title },
  ];

  const hasImage = Boolean(question.image_url?.trim());

  return (
    <article className="article-detail mx-auto w-full max-w-3xl px-0 sm:px-1">
      <Breadcrumbs items={crumbs} />
      <header className="mb-6 sm:mb-8">
        <p className="flex flex-wrap items-center gap-x-2 text-xs font-semibold uppercase tracking-wider text-category">
          <MasterEditable
            entity="question"
            id={question.id}
            field="category"
            fieldType="text"
            label="Kategori (veritabanı değeri)"
            initialValue={question.category}
          >
            <span>{categoryLabelForLang(question.category, lang)}</span>
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
          wrapClassName="mt-2"
        >
          <h1 className="border-b-[3px] border-brand/35 pb-3 font-serif text-2xl font-bold leading-[1.15] tracking-tight text-zinc-900 sm:text-4xl sm:leading-tight">
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
          wrapClassName="mt-3"
        >
          {question.excerpt?.trim() ? (
            <p className="hyphens-auto text-pretty text-justify text-lg leading-relaxed text-zinc-600">
              {question.excerpt}
            </p>
          ) : null}
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
        wrapClassName=""
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
        wrapClassName="w-full max-w-3xl"
      >
        <ArticleMarkdownBody
          markdown={question.content ?? ""}
          className="article-detail-body text-base leading-[1.75] sm:text-[1.0625rem] sm:leading-[1.8]"
        />
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
        <p>
          <span className="text-zinc-400">Bölge:</span> {question.region}
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
