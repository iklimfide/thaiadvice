import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  isFaqQuestionOnlyQuickAnswerLabel,
  stripFaqQuickAnswerPrefix,
} from "@/lib/format/faq-display";
import type { FaqEntryRow } from "@/lib/types/database";

type Props = {
  items: FaqEntryRow[];
  title?: string;
  /** Makale / mekân detay sayfasında başlık stili */
  detailLayout?: boolean;
};

function faqPageJsonLd(items: FaqEntryRow[]): Record<string, unknown> {
  const mainEntity = items.map((f) => {
    const answer = stripFaqQuickAnswerPrefix(f.short_answer_text);
    const hideQ = isFaqQuestionOnlyQuickAnswerLabel(f.question);
    return {
      "@type": "Question",
      name: hideQ ? answer.slice(0, 120) : f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    };
  });
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity,
  };
}

export function FaqSection({ items, title = "SSS", detailLayout }: Props) {
  if (items.length === 0) return null;

  const faqLd = faqPageJsonLd(items);

  return (
    <section className="mt-10 border-t border-zinc-200 pt-8 sm:mt-12 sm:pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqLd).replace(/</g, "\\u003c"),
        }}
      />
      <SectionTitle variant={detailLayout ? "detail" : "default"}>
        {title}
      </SectionTitle>
      <dl className="space-y-4">
        {items.map((f) => {
          const answer = stripFaqQuickAnswerPrefix(f.short_answer_text);
          const hideQuestion = isFaqQuestionOnlyQuickAnswerLabel(f.question);
          return (
          <div
            key={f.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-brand/25"
          >
            {hideQuestion ? null : (
              <dt className="font-semibold text-zinc-900">{f.question}</dt>
            )}
            <dd
              className={`hyphens-manual whitespace-pre-wrap text-justify text-sm leading-relaxed text-zinc-600 text-pretty ${hideQuestion ? "" : "mt-2"}`}
            >
              {answer}
            </dd>
            {f.warning_text ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                {f.warning_text}
              </p>
            ) : null}
            {f.long_article_slug ? (
              <p className="mt-2 text-xs text-zinc-500">
                İlgili makale slug:{" "}
                <code className="rounded-md bg-violet-50 px-1.5 py-0.5 text-category">
                  {f.long_article_slug}
                </code>
              </p>
            ) : null}
          </div>
          );
        })}
      </dl>
    </section>
  );
}
