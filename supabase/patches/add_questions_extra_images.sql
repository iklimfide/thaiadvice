-- Makale detayında kapak dışında ek görseller (JSON dizi).
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS extra_images jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.questions.extra_images IS
  'Kapak dışı görseller: [{"url":"...","alt":"..."}, ...]; boş dizi.';
