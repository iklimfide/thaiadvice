-- Veritabanı şeması (referans; FK sırasına göre düzenlendi).
--
-- Tablolar zaten varsa (42P07 "already exists"): bu dosyayı çalıştırmayın —
-- yalnızca RLS için: supabase/rls_public_content.sql
--
-- IF NOT EXISTS: aynı dosyayı tekrar çalıştırmak tablo oluşturmayı atlar (sütun eklemez).

CREATE TABLE IF NOT EXISTS public.regions (
  id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT ''::text,
  image text NOT NULL DEFAULT ''::text,
  CONSTRAINT regions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.sub_regions (
  id text NOT NULL,
  region_id text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  CONSTRAINT sub_regions_pkey PRIMARY KEY (id),
  CONSTRAINT sub_regions_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id)
);

CREATE TABLE IF NOT EXISTS public.places (
  id text NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  region_id text NOT NULL,
  sub_region_id text NOT NULL,
  price_level text NOT NULL CHECK (price_level = ANY (ARRAY['$'::text, '$$'::text, '$$$'::text])),
  rating numeric NOT NULL DEFAULT 0,
  image text NOT NULL DEFAULT ''::text,
  ai_intro text NOT NULL DEFAULT ''::text,
  CONSTRAINT places_pkey PRIMARY KEY (id),
  CONSTRAINT places_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.regions(id),
  CONSTRAINT places_sub_region_id_fkey FOREIGN KEY (sub_region_id) REFERENCES public.sub_regions(id)
);

CREATE TABLE IF NOT EXISTS public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lang text NOT NULL,
  category text NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  author text NOT NULL DEFAULT 'Perlamare'::text,
  related_slugs text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  image_url text,
  region text NOT NULL DEFAULT 'tayland'::text,
  CONSTRAINT questions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.faq_entries (
  id text NOT NULL,
  category text NOT NULL,
  question text NOT NULL,
  short_answer_text text NOT NULL,
  long_article_slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  warning_text text,
  CONSTRAINT faq_entries_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.faq_items (
  id text NOT NULL,
  category text NOT NULL,
  question text NOT NULL,
  short_answer text NOT NULL,
  long_article_slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT faq_items_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.article_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  image_url text,
  author_alias text NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  CONSTRAINT article_submissions_pkey PRIMARY KEY (id)
);

-- RLS: Tablolar Supabase’de kilitliyse site anon anahtarla okuyamaz.
-- Çalıştır: supabase/rls_public_content.sql
