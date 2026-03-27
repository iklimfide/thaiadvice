-- "Özel durumlar" → alisilmadik-durumlar
-- Hata: questions_lang_region_category_slug_key — aynı slug için iki satır varsa
-- önce çiftteki ozel satırını sil, sonra kalanları güncelle.

-- Önizleme: çakışacak çiftler (silinecek ozel tarafı)
SELECT q.id, q.lang, q.region, q.slug, q.category AS ozel_kategori
FROM questions q
INNER JOIN questions k
  ON k.lang = q.lang
  AND k.region = q.region
  AND k.slug = q.slug
  AND k.category = 'alisilmadik-durumlar'
  AND k.id <> q.id
WHERE (
  LOWER(TRIM(q.category)) IN ('ozel-durumlar', 'özel-durumlar')
  OR TRIM(q.category) IN (
    'ozel-durumlar',
    'özel-durumlar',
    'Ozel-durumlar',
    'Özel-durumlar',
    'Özel durumlar',
    'ozel durumlar'
  )
);

-- 1) Aynı (lang, region, slug) için zaten alisilmadik-durumlar varsa: ozel satırını sil
DELETE FROM questions q
USING questions k
WHERE k.lang = q.lang
  AND k.region = q.region
  AND k.slug = q.slug
  AND k.category = 'alisilmadik-durumlar'
  AND q.id <> k.id
  AND (
    LOWER(TRIM(q.category)) IN ('ozel-durumlar', 'özel-durumlar')
    OR TRIM(q.category) IN (
      'ozel-durumlar',
      'özel-durumlar',
      'Ozel-durumlar',
      'Özel-durumlar',
      'Özel durumlar',
      'ozel durumlar'
    )
  );

-- 1b) İkisi de hâlâ ozel ve aynı (lang, region, slug): id büyük olanı sil
DELETE FROM questions q1
USING questions q2
WHERE q1.lang = q2.lang
  AND q1.region = q2.region
  AND q1.slug = q2.slug
  AND q1.id > q2.id
  AND (
    LOWER(TRIM(q1.category)) IN ('ozel-durumlar', 'özel-durumlar')
    OR TRIM(q1.category) IN (
      'ozel-durumlar',
      'özel-durumlar',
      'Ozel-durumlar',
      'Özel-durumlar',
      'Özel durumlar',
      'ozel durumlar'
    )
  )
  AND (
    LOWER(TRIM(q2.category)) IN ('ozel-durumlar', 'özel-durumlar')
    OR TRIM(q2.category) IN (
      'ozel-durumlar',
      'özel-durumlar',
      'Ozel-durumlar',
      'Özel-durumlar',
      'Özel durumlar',
      'ozel durumlar'
    )
  );

-- 2) Kalan ozel satırlarını birleştir
UPDATE questions
SET category = 'alisilmadik-durumlar'
WHERE TRIM(category) IN (
  'ozel-durumlar',
  'özel-durumlar',
  'Ozel-durumlar',
  'Özel-durumlar',
  'Özel durumlar',
  'ozel durumlar'
);

UPDATE questions
SET category = 'alisilmadik-durumlar'
WHERE LOWER(TRIM(category)) IN ('ozel-durumlar', 'özel-durumlar');

-- article_submissions (bu tabloda aynı unique yok; doğrudan güncelle)
UPDATE article_submissions
SET category = 'alisilmadik-durumlar'
WHERE TRIM(category) IN (
  'ozel-durumlar',
  'özel-durumlar',
  'Ozel-durumlar',
  'Özel-durumlar',
  'Özel durumlar',
  'ozel durumlar'
);

UPDATE article_submissions
SET category = 'alisilmadik-durumlar'
WHERE LOWER(TRIM(category)) IN ('ozel-durumlar', 'özel-durumlar');

SELECT category, COUNT(*) AS adet
FROM questions
GROUP BY category
ORDER BY category;
