-- Makale içeriğindeki "Perlamare görüşü / tavsiyesi" başlık ve vurgularını
-- "Arif GÜVENÇ tavsiyesi" ile değiştirir. Supabase SQL Editor’de bir kez çalıştırın.

UPDATE public.questions
SET content = replace(
  replace(
    replace(
      replace(
        replace(
          replace(
            content,
            E'## 💡 Perlamare tavsiyesi (uzman notu)',
            E'## 💡 Arif GÜVENÇ tavsiyesi (uzman notu)'
          ),
          E'## Perlamare görüşü',
          E'## Arif GÜVENÇ tavsiyesi'
        ),
        E'### Perlamare Analizi & Tavsiyesi',
        E'### Arif GÜVENÇ analizi & tavsiyesi'
      ),
      E'**Perlamare tavsiyesi nettir:**',
      E'**Arif GÜVENÇ tavsiyesi nettir:**'
    ),
    E'**Perlamare tavsiyesi:**',
    E'**Arif GÜVENÇ tavsiyesi:**'
  ),
  E'Perlamare tavsiyesi:',
  E'Arif GÜVENÇ tavsiyesi:'
)
WHERE content LIKE '%Perlamare%';
