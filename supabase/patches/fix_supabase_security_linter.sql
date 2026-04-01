-- =============================================================================
-- Supabase güvenlik / linter düzeltmeleri — SQL Editor’de tek seferde çalıştırın.
--
-- 1) Trigger fonksiyonları: "mutable search_path" (questions_touch_updated_at vb.)
-- 2) article_submissions: INSERT politikası WITH CHECK (true) / authenticated_* —
--    kısıtlı WITH CHECK (status pending, kategori whitelist, uzunluklar)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) search_path
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        n.nspname,
        p.proname,
        coalesce(nullif(pg_get_function_identity_arguments(p.oid), ''), '')
      ) AS ddl
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'questions_touch_updated_at',
        'questions_set_updated_at'
      )
  LOOP
    EXECUTE r.ddl;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 2) article_submissions INSERT — WITH CHECK her zaman true olmasın
-- ---------------------------------------------------------------------------
ALTER TABLE public.article_submissions ENABLE ROW LEVEL SECURITY;

-- Dashboard / eski isimler
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
