-- Mevcut projeler: alt bölge kartlarında görsel için sütun ekler.
-- Supabase SQL Editor’da bir kez çalıştırın.

ALTER TABLE public.sub_regions
  ADD COLUMN IF NOT EXISTS image text NOT NULL DEFAULT ''::text;
