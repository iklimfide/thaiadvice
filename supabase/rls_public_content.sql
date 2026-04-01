-- ThaiAdvice: Next.js sunucusu anon (NEXT_PUBLIC_SUPABASE_ANON_KEY) ile okur.
-- RLS açık ve SELECT politikası yoksa liste/detay boş gelir; import script service role ile yazar.
-- Supabase → SQL Editor → çalıştırın. İsterseniz politikaları Dashboard → Authentication → Policies’ten de ekleyebilirsiniz.
--
-- Politika varken hâlâ 0 satır: çoğu zaman tabloda anon için GRANT SELECT yoktur — aşağıdaki GRANT’ları çalıştırın.

-- ========== Şema erişimi (anon API) ==========

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.regions TO anon, authenticated;
GRANT SELECT ON public.sub_regions TO anon, authenticated;
GRANT SELECT ON public.places TO anon, authenticated;
GRANT SELECT ON public.questions TO anon, authenticated;
GRANT SELECT ON public.faq_entries TO anon, authenticated;
GRANT SELECT ON public.faq_items TO anon, authenticated;
GRANT INSERT ON public.article_submissions TO anon, authenticated;

-- ========== Okuma: herkese açık içerik ==========

ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_regions" ON public.regions;
CREATE POLICY "public_select_regions"
  ON public.regions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public_select_sub_regions" ON public.sub_regions;
CREATE POLICY "public_select_sub_regions"
  ON public.sub_regions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public_select_places" ON public.places;
CREATE POLICY "public_select_places"
  ON public.places FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public_select_questions" ON public.questions;
CREATE POLICY "public_select_questions"
  ON public.questions FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public_select_faq_entries" ON public.faq_entries;
CREATE POLICY "public_select_faq_entries"
  ON public.faq_entries FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "public_select_faq_items" ON public.faq_items;
CREATE POLICY "public_select_faq_items"
  ON public.faq_items FOR SELECT
  TO anon, authenticated
  USING (true);

-- ========== Öneri formu: anon INSERT (service role yoksa gerekli) ==========

ALTER TABLE public.article_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_insert_article_submissions" ON public.article_submissions;
DROP POLICY IF EXISTS "anon_insert_article_submissions" ON public.article_submissions;
DROP POLICY IF EXISTS "public_insert_article_submissions" ON public.article_submissions;
CREATE POLICY "public_insert_article_submissions"
  ON public.article_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND category IN (
      'yemek',
      'vize',
      'ulasim',
      'gece-hayati',
      'yasam',
      'para-alisveris',
      'alisilmadik-durumlar',
      'saglik',
      'guvenlik',
      'kurumsal'
    )
    AND char_length(btrim(title)) >= 1
    AND char_length(title) <= 500
    AND char_length(btrim(content)) >= 1
    AND char_length(content) <= 25000
    AND char_length(btrim(author_alias)) >= 1
    AND char_length(author_alias) <= 200
    AND (image_url IS NULL OR char_length(image_url) <= 3000)
  );

-- Not: SELECT/UPDATE/DELETE submissions için politika yok; moderasyon Supabase Dashboard veya service role ile.
