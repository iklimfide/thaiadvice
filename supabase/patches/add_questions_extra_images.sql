-- Makale detayında kapak dışı görseller (alt başlık grupları).
-- Supabase SQL Editor’da bir kez çalıştırın. Hata devam ederse Dashboard → Settings → API → "Reload schema" veya projeyi yeniden başlatın.

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS extra_images jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.questions.extra_images IS
  'Kapak dışı görseller: [{"heading":"Alt başlık","images":[{"url":"...","alt":"..."}]}]; eski düz [{url,alt}] tek bölüme dönüşür.';

-- PostgREST şema önbelleğini yenile (Supabase API)
NOTIFY pgrst, 'reload schema';
