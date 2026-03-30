-- questions: site genelinde listelerden ve (master değilse) detaydan gizlemek için
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.questions.is_hidden IS 'true ise anon ziyaretçi listelerde ve detayda görünmez; master doğrudan URL ile açıp yönetebilir.';
