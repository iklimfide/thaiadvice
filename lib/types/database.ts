/** Veritabanı şemasıyla birebir uyum (public.*). */

export type RegionRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
};

export type SubRegionRow = {
  id: string;
  region_id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
};

export type PlaceRow = {
  id: string;
  slug: string;
  name: string;
  region_id: string;
  sub_region_id: string;
  price_level: "$" | "$$" | "$$$";
  rating: number;
  image: string;
  ai_intro: string;
};

export type QuestionRow = {
  id: string;
  lang: string;
  category: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string | null;
  author: string;
  related_slugs: string[];
  created_at: string;
  image_url: string | null;
  /** Görsel/alt metin notları; gövdede gösterilmez, SEO için */
  media_seo_text: string | null;
  region: string;
};

/** public.faq_entries */
export type FaqEntryRow = {
  id: string;
  category: string;
  question: string;
  short_answer_text: string;
  long_article_slug: string;
  sort_order: number;
  warning_text: string | null;
};

/** public.faq_items */
export type FaqItemRow = {
  id: string;
  category: string;
  question: string;
  short_answer: string;
  long_article_slug: string;
  sort_order: number;
};
