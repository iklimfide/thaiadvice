import { SectionTitle } from "@/components/ui/SectionTitle";
import type { FaqEntryRow } from "@/lib/types/database";

type Props = {
  items: FaqEntryRow[];
  title?: string;
  /** Makale / mekân detay sayfasında başlık stili */
  detailLayout?: boolean;
};

export function FaqSection({ items, title = "SSS", detailLayout }: Props) {
  if (items.length === 0) return null;

  return (
    <section className="mt-10 border-t border-zinc-200 pt-8 sm:mt-12 sm:pt-10">
      <SectionTitle variant={detailLayout ? "detail" : "default"}>
        {title}
      </SectionTitle>
      <dl className="space-y-4">
        {items.map((f) => (
          <div
            key={f.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-brand/25"
          >
            <dt className="font-semibold text-zinc-900">{f.question}</dt>
            <dd className="mt-2 hyphens-auto whitespace-pre-wrap text-justify text-sm leading-relaxed text-zinc-600 text-pretty">
              {f.short_answer_text}
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
        ))}
      </dl>
    </section>
  );
}
