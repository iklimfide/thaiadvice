-- Kurumsal “Biz kimiz / Arif GÜVENÇ kimdir” sayfası (ana akışta listelenmez; menüden link).
-- A) Supabase SQL Editor’da çalıştırın (idempotent).
-- B) Yerelde: .env.local dolu iken `npm run seed:about` (aynı içerik).

DELETE FROM public.questions
WHERE lang = 'tr'
  AND region = 'genel'
  AND category = 'kurumsal'
  AND slug = 'arif-guvenc-kimdir';

INSERT INTO public.questions (
  lang,
  category,
  slug,
  title,
  content,
  excerpt,
  author,
  region,
  related_slugs,
  is_hidden,
  media_seo_text
)
VALUES (
  'tr',
  'kurumsal',
  'arif-guvenc-kimdir',
  'Biz Kimiz? Bir Mühendisin Bilgi Mirası ve Yolculuğu | Arif GÜVENÇ',
  $c$
# Biz Kimiz? Toprağın Bilgeliğinden Dijital Mirasa

Haritaya bakmakla haritayı hissetmek arasında devasa bir fark vardır. Benim hikayem, sadece katedilen kilometreleri değil, biriktirilen tecrübeyi ve doğru şekilde "kök salmayı" merkezine alan bir yolculuktur.

### Topraktan Gelen Disiplin: İklim Fide

Hayatımın temel taşı, 19 yıl önce Antalya’da filizlenen ve bugün dev bir fidancılık operasyonuna dönüşen şirketim **[iklimfide.com](https://iklimfide.com)** ile atıldı. Bir **Ziraat Mühendisi** olarak hayatı; ekmek, sabırla büyütmek ve en doğru zamanda hasat etmek üzerine kurguladım. Toprağı bilen, bir tohumun çatlama anındaki o sessiz gücü anlayan bir zihin; bir şehri, bir kültürü ve karmaşık bir sistemi de en küçük hücresine kadar analiz edebilir. Benim için her yeni rota, doğru analiz edilmesi gereken devasa bir "yaşam laboratuvarıdır".

### Dijital Gelecek: Woxsify ve Ne Getirmiş

Dünya değişiyor ve ben bu değişimin sadece izleyicisi değil, aktif bir parçasıyım. **[Woxsify.com](https://woxsify.com)** projemle bilginin özgürce paylaşılacağı bir platform inşa ederken, **[negetirmis.com](https://negetirmis.com)** ile sınır ötesi ihtiyaçlara çözüm üretiyorum. Teknolojiyi, insan hayatını kolaylaştıran bir lojistik araç olarak görüyor; dijital göçebelikten sınır ötesi yatırımlara kadar her alanda "stratejik bir rehberlik" sunuyorum.

### Neden Buradasınız?

Bu platformda "nerede ne yenir" sorusundan çok daha fazlasını bulacaksınız. Ben, "Bu sistemin lojistiği nasıl işliyor?", "Burada nasıl güvenli ve verimli bir yaşam kurulur?" sorularının peşinden gidiyorum.

* **Analitik Bakış:** Bir mühendisin cetveliyle çizilmiş kadar net ve teknik bilgiler.
* **Gerçek Saha Tecrübesi:** Bizzat yaşanmış, test edilmiş ve tüm katmanlarıyla süzülmüş somut deneyimler.
* **Bir Babanın Sorumluluğu:** Evlatlarıma bırakacağım bir mirasın ciddiyetiyle hazırlanan, dürüst ve koruyucu içerikler.

## Arif GÜVENÇ tavsiyesi

"Benim için seyahat; pasaporta vurulan bir mühürden ibaret değildir. Seyahat; bir şehri, bir kültürü ve o kültürün içindeki fırsatları bir stratejist gibi okuyabilmektir. İklim Fide ile toprağa attığım tohumları, bugün bu platformda bilgi olarak ekiyorum. Tek amacım; 10 yıl sonra bu satırları okuyanların, 'İyi ki bu tecrübe paylaşılmış' diyeceği sarsılmaz bir miras bırakmak."

---

*Bu sayfa, Arif GÜVENÇ'in şahsi vizyonu ve projelerinin bütünleşik bir yansımasıdır.*
$c$,
  '27 yıllık Ziraat Mühendisi disiplini, İklim Fide tecrübesi ve Woxsify vizyonuyla Tayland rehberliğinin arkasındaki gerçek hikaye.',
  'Arif GÜVENÇ',
  'genel',
  '{}',
  false,
  $m$
GÖRSEL: Bir yanda modern bir tarım arazisi (İklim Fide), diğer yanda Tayland'ın ikonik bir şehir manzarası ve ortada bir dizüstü bilgisayarla analiz yapan Arif GÜVENÇ kolajı.
ALT-TEXT: Arif GÜVENÇ vizyonu, İklim Fide, Woxsify ve Ne Getirmiş projeleri.
  $m$
);
