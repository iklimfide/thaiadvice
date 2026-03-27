import type {
  FaqEntryRow,
  FaqItemRow,
  PlaceRow,
  QuestionRow,
  RegionRow,
  SubRegionRow,
} from "@/lib/types/database";

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

function str(v: unknown, fallback = ""): string {
  if (v == null || v === "") return fallback;
  return typeof v === "string" ? v : String(v);
}

const PRICE_LEVELS = new Set(["$", "$$", "$$$"]);

export function mapRegionRow(raw: unknown): RegionRow {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    name: str(r.name),
    slug: str(r.slug),
    description: str(r.description),
    image: str(r.image),
  };
}

export function mapSubRegionRow(raw: unknown): SubRegionRow {
  const r = asRecord(raw);
  return {
    id: str(r.id),
    region_id: str(r.region_id),
    name: str(r.name),
    slug: str(r.slug),
    description: str(r.description),
    image: str(r.image),
  };
}

export function mapPlaceRow(raw: unknown): PlaceRow {
  const r = asRecord(raw);
  const pl = str(r.price_level, "$");
  const price_level = (PRICE_LEVELS.has(pl) ? pl : "$") as PlaceRow["price_level"];
  const ratingRaw = r.rating;
  const rating =
    typeof ratingRaw === "number"
      ? ratingRaw
      : Number(ratingRaw) || 0;

  return {
    id: str(r.id),
    slug: str(r.slug),
    name: str(r.name),
    region_id: str(r.region_id),
    sub_region_id: str(r.sub_region_id),
    price_level,
    rating,
    image: str(r.image),
    ai_intro: str(r.ai_intro),
  };
}

export function mapQuestionRow(raw: unknown): QuestionRow {
  const r = asRecord(raw);
  const related = r.related_slugs;
  const related_slugs = Array.isArray(related)
    ? related.map((x) => String(x))
    : [];

  return {
    id: str(r.id),
    lang: str(r.lang),
    category: str(r.category),
    slug: str(r.slug),
    title: str(r.title),
    content: str(r.content),
    excerpt:
      r.excerpt == null || str(r.excerpt) === "" ? null : str(r.excerpt),
    author: str(r.author),
    related_slugs,
    created_at: str(r.created_at),
    image_url:
      r.image_url == null || str(r.image_url) === ""
        ? null
        : str(r.image_url),
    region: str(r.region),
  };
}

export function mapFaqEntryRow(raw: unknown): FaqEntryRow {
  const r = asRecord(raw);
  const so = r.sort_order;
  const sort_order =
    typeof so === "number" ? so : Number(so) || 0;

  return {
    id: str(r.id),
    category: str(r.category),
    question: str(r.question),
    short_answer_text: str(r.short_answer_text),
    long_article_slug: str(r.long_article_slug),
    sort_order,
    warning_text:
      r.warning_text == null || str(r.warning_text) === ""
        ? null
        : str(r.warning_text),
  };
}

export function mapFaqItemRow(raw: unknown): FaqItemRow {
  const r = asRecord(raw);
  const so = r.sort_order;
  const sort_order =
    typeof so === "number" ? so : Number(so) || 0;

  return {
    id: str(r.id),
    category: str(r.category),
    question: str(r.question),
    short_answer: str(r.short_answer),
    long_article_slug: str(r.long_article_slug),
    sort_order,
  };
}
