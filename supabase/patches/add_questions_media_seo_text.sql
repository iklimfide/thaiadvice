-- Görsel / alt-metin blokları (export 5. madde): okuyucuya gösterilmez; SEO / botlar.
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS media_seo_text text;

COMMENT ON COLUMN public.questions.media_seo_text IS
  'Görsel ve çok dilli alt metin (kaynak metin). Makale gövdesinde değil; JSON-LD ve og:image:alt ile botlara.';
