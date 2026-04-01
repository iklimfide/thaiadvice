-- Makale yayın (created_at) ve güncelleme (updated_at) tarihleri.
-- Supabase SQL Editor’de bir kez çalıştırın.

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

UPDATE public.questions
SET updated_at = created_at
WHERE updated_at IS DISTINCT FROM created_at;

-- UPDATE sırasında updated_at otomatik
-- SET search_path: Supabase linter (mutable search_path) / güvenlik
CREATE OR REPLACE FUNCTION public.questions_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS questions_set_updated_at ON public.questions;
CREATE TRIGGER questions_set_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.questions_set_updated_at();

COMMENT ON COLUMN public.questions.updated_at IS 'Son içerik güncellemesi (yayın tarihi created_at).';
