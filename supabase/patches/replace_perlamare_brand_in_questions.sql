-- Makale metinlerinde "Perlamare" → "Arif GÜVENÇ" (tüm yaygın yazımlar).
-- Supabase SQL Editor’da bir kez çalıştırın; idempotent (kalan eşleşme yoksa satır güncellenmez).

UPDATE public.questions
SET
  title = replace(
    replace(replace(title, 'PERLAMARE', 'Arif GÜVENÇ'), 'Perlamare', 'Arif GÜVENÇ'),
    'perlamare',
    'Arif GÜVENÇ'
  ),
  content = replace(
    replace(replace(content, 'PERLAMARE', 'Arif GÜVENÇ'), 'Perlamare', 'Arif GÜVENÇ'),
    'perlamare',
    'Arif GÜVENÇ'
  ),
  excerpt = CASE
    WHEN excerpt IS NULL THEN NULL
    ELSE replace(
      replace(replace(excerpt, 'PERLAMARE', 'Arif GÜVENÇ'), 'Perlamare', 'Arif GÜVENÇ'),
      'perlamare',
      'Arif GÜVENÇ'
    )
  END,
  media_seo_text = CASE
    WHEN media_seo_text IS NULL THEN NULL
    ELSE replace(
      replace(
        replace(media_seo_text, 'PERLAMARE', 'Arif GÜVENÇ'),
        'Perlamare',
        'Arif GÜVENÇ'
      ),
      'perlamare',
      'Arif GÜVENÇ'
    )
  END,
  updated_at = now()
WHERE
  title ILIKE '%perlamare%'
  OR content ILIKE '%perlamare%'
  OR excerpt ILIKE '%perlamare%'
  OR media_seo_text ILIKE '%perlamare%';

-- SSS kısa cevaplarda geçen ifadeler
UPDATE public.faq_entries
SET
  question = replace(
    replace(replace(question, 'PERLAMARE', 'Arif GÜVENÇ'), 'Perlamare', 'Arif GÜVENÇ'),
    'perlamare',
    'Arif GÜVENÇ'
  ),
  short_answer_text = replace(
    replace(
      replace(short_answer_text, 'PERLAMARE', 'Arif GÜVENÇ'),
      'Perlamare',
      'Arif GÜVENÇ'
    ),
    'perlamare',
    'Arif GÜVENÇ'
  ),
  updated_at = now()
WHERE
  question ILIKE '%perlamare%'
  OR short_answer_text ILIKE '%perlamare%';

-- Eski şema: faq_items
UPDATE public.faq_items
SET
  question = replace(
    replace(replace(question, 'PERLAMARE', 'Arif GÜVENÇ'), 'Perlamare', 'Arif GÜVENÇ'),
    'perlamare',
    'Arif GÜVENÇ'
  ),
  short_answer = replace(
    replace(
      replace(short_answer, 'PERLAMARE', 'Arif GÜVENÇ'),
      'Perlamare',
      'Arif GÜVENÇ'
    ),
    'perlamare',
    'Arif GÜVENÇ'
  ),
  updated_at = now()
WHERE
  question ILIKE '%perlamare%'
  OR short_answer ILIKE '%perlamare%';

-- Bekleyen kullanıcı gönderileri
UPDATE public.article_submissions
SET
  title = replace(
    replace(replace(title, 'PERLAMARE', 'Arif GÜVENÇ'), 'Perlamare', 'Arif GÜVENÇ'),
    'perlamare',
    'Arif GÜVENÇ'
  ),
  content = replace(
    replace(replace(content, 'PERLAMARE', 'Arif GÜVENÇ'), 'Perlamare', 'Arif GÜVENÇ'),
    'perlamare',
    'Arif GÜVENÇ'
  )
WHERE title ILIKE '%perlamare%' OR content ILIKE '%perlamare%';

-- Mekân tanıtımları
UPDATE public.places
SET
  name = replace(
    replace(replace(name, 'PERLAMARE', 'Arif GÜVENÇ'), 'Perlamare', 'Arif GÜVENÇ'),
    'perlamare',
    'Arif GÜVENÇ'
  ),
  ai_intro = replace(
    replace(replace(ai_intro, 'PERLAMARE', 'Arif GÜVENÇ'), 'Perlamare', 'Arif GÜVENÇ'),
    'perlamare',
    'Arif GÜVENÇ'
  )
WHERE name ILIKE '%perlamare%' OR ai_intro ILIKE '%perlamare%';
