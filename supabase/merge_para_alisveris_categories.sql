-- Eski "Para" / "Alışveriş" yazımlarını kanonik sluga çeker.
-- Uygulama alias ile zaten toparlar; bu script DB’yi temiz tutar (URL/slug tutarlılığı).
-- Çalıştırmadan önce: aşağıdaki SELECT ile gerçekten bu değerler var mı bakın.
-- Hepsi zaten "para-alisveris" ise ÇALIŞTIRMANIZA GEREK YOK.

-- Önizleme
SELECT category, COUNT(*) AS adet
FROM questions
GROUP BY category
ORDER BY category;

-- Kanonik slug (kod: QUESTION_CATEGORY_DEFS → para-alisveris)
UPDATE questions
SET category = 'para-alisveris'
WHERE TRIM(category) IN ('Para', 'Alışveriş', 'Para ve alışveriş');

UPDATE questions
SET category = 'para-alisveris'
WHERE TRIM(category) IN ('para', 'alışveriş', 'para ve alışveriş');

-- Kontrol
SELECT category, COUNT(*) AS adet
FROM questions
GROUP BY category
ORDER BY category;
