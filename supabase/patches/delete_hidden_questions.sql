-- is_hidden = true olan tüm questions satırlarını kalıcı siler.
-- Supabase SQL Editor’da önce SELECT ile önizleyin, sonra DELETE çalıştırın.
--
-- Not: faq_entries / faq_items gibi tablolarda long_article_slug veya category ile
-- bu makalelere referans kaldıysa, silme sonrası SSS kayıtlarını elle kontrol edin.

-- 1) Önizleme (kaç satır, hangi makaleler)
SELECT id, lang, region, category, slug, title, created_at
FROM public.questions
WHERE is_hidden = true
ORDER BY region, category, slug, lang;

-- 2) Silme — önizlemeyi gördükten sonra çalıştırın (geri alınamaz)
DELETE FROM public.questions
WHERE is_hidden = true;
