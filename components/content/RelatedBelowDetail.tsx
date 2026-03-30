import { PlaceCard } from "@/components/cards/PlaceCard";
import { PostCard } from "@/components/home/PostCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { PlaceRow, QuestionRow } from "@/lib/types/database";

type ArticlesProps = {
  lang: string;
  questions: QuestionRow[];
};

export function RelatedArticlesBelowDetail({
  lang,
  questions,
}: ArticlesProps) {
  if (questions.length === 0) return null;
  const title =
    lang === "tr" ? "Bunlar da İlginizi Çekebilir" : "You may also like";
  return (
    <section
      className="mt-12 w-full border-t border-zinc-200 pt-10 sm:mt-14 sm:pt-12"
      aria-labelledby="related-articles-heading"
    >
      <SectionTitle variant="detail" id="related-articles-heading">
        {title}
      </SectionTitle>
      <ul className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
        {questions.map((q) => (
          <li key={q.id} className="min-w-0">
            <PostCard lang={lang} question={q} />
          </li>
        ))}
      </ul>
    </section>
  );
}

type PlacesProps = {
  lang: string;
  regionSlug: string;
  subRegionSlug: string;
  places: PlaceRow[];
};

export function RelatedPlacesBelowDetail({
  lang,
  regionSlug,
  subRegionSlug,
  places,
}: PlacesProps) {
  if (places.length === 0) return null;
  const title =
    lang === "tr" ? "Bunlar da İlginizi Çekebilir" : "You may also like";
  return (
    <section
      className="mt-12 w-full border-t border-zinc-200 pt-10 sm:mt-14 sm:pt-12"
      aria-labelledby="related-places-heading"
    >
      <SectionTitle variant="detail" id="related-places-heading">
        {title}
      </SectionTitle>
      <ul className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 xl:grid-cols-3">
        {places.map((p) => (
          <li key={p.id} className="min-w-0">
            <PlaceCard
              lang={lang}
              regionSlug={regionSlug}
              subRegionSlug={subRegionSlug}
              place={p}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
