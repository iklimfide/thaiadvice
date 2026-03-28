-- Vize rehberi gövdesi: repo içi kaynak content/articles/tr/tayland-vize-muafiyeti-giris-rehberi.md
-- Supabase → SQL Editor. Tek satır güncellenmezse slug/kategori/region değerlerinizi kontrol edin.

UPDATE public.questions
SET
  content = $ta_vize$## 🛂 Hızlı özet (2026)

- **Türkiye Cumhuriyeti pasaportu** ile turistik girişlerde **60 güne kadar vize muafiyeti** uygulanır.
- Pasaportun **giriş tarihinden itibaren en az 6 ay** geçerli olmalı.
- **Dönüş bileti** ve **konaklama kanıtı** (ör. ilk günler otel rezervasyonu) girişte istenebilir; yanınızda bulundurun.

---

## ✈️ 60 günlük muafiyet ve uzatma

Tayland, turizmi desteklemek için birçok ülke vatandaşına **vizesiz kalış süresini 60 güne** çıkarmıştır.

- İlk dönem: **60 gün** (muafiyet koşullarına uygun girişlerde).
- **Uzatma:** Göçmenlik (Immigration Office) üzerinden, yaklaşık **1.900 THB** karşılığında **bir kez** yaklaşık **30 gün** daha uzatılabilir; toplamda turistik konaklama **90 güne** kadar çıkabilir.
- Uzatma kuralları ve ücretler resmi duyurulara göre değişebilir; seyahat öncesi güncel kaynakları kontrol edin.

---

## 📋 Sınır kapısında sık istenen belgeler

Vize muafiyeti, **girişin garanti** olduğu anlamına gelmez; göçmenlik memurları aşağıdakileri talep edebilir:

1. **🪪 Pasaport** — En az **6 ay** geçerlilik (giriş tarihine göre).
2. **✈️ Dönüş / çıkış bileti** — Tayland’dan ayrılacağınızı gösteren uçak bileti veya kabul edilen alternatif kanıt.
3. **🏨 Konaklama** — İlk günler için **otel rezervasyonu** veya davet / adres bilgisi.
4. **💵 Nakit / mali yeterlilik** — Bazen **kişi başı en az 20.000 THB** veya eşdeğeri döviz kanıtı istenebilir; her girişte sorulmayabilir ama hazırlıklı olun.

---

## 🌏 DTV ve uzun süreli seçenekler

**90 günden fazla** kalmayı planlıyorsanız:

- **Destination Thailand Visa (DTV)** 2026 itibarıyla sık tercih edilen modellerden biridir; uzaktan çalışanlar, dijital göçebeler veya belirli faaliyetler (ör. Muay Thai eğitimi) için tasarlanmış çerçeveler söz konusudur.
- Örnek duyurulan kalemler (resmi şartlar değişebilir):
  - Yaklaşık **10.000 THB** harç bedeli.
  - **500.000 THB** düzeyinde **finansal yeterlilik** kanıtı talepleri gündeme gelmiştir.

> Kesin süre, ücret ve belgeler için **Tayland Göç İdaresi** veya konsolosluk duyurularına bakın; bu metin genel rehber niteliğindedir.

---

## 🚗 Kara sınırı: “visa run” sınırı

- **Havalimanı** girişlerinde genellikle **ayrı bir “yılda 2 kez” kara sınırı kuralı** söz konusu olmayabilir; güncel uygulama memur takdirine ve politikalara bağlıdır.
- **Kara sınır kapılarından** (Malezya, Laos, Kamboçya vb.) yapılan **vizesiz girişler**, takvim yılı içinde **sınırlı sayıda** (örnek uygulama: **yılda 2 kez**) ile kotalanabilir; amaç “visa run” suistimalini azaltmaktır.
- Sık giriş–çıkış ihtiyacınız varsa **havalimanı girişleri** ve **uygun uzun süreli vize türleri** genelde daha öngörülebilir yollardır.

---

## 💡 Perlamare tavsiyesi (uzman notu)

> Tayland’a girişte pasaport kontrolünde **profesyonel ve hazırlıklı** görünmek sürecin büyük kısmını kolaylaştırır. **Perlamare tavsiyesi:** Dijital belgelere tek başına güvenmeyin; **dönüş bileti** ve **ilk konaklama** için **çıktı** bulundurun. Göçmenlik nakit kontrolü isterse ATM’ye yönlendirmeyebilir; **500–600 USD** bandında **yedek nakit** taşımak pratik bir güvenlik önlemidir. Pasaportda **boş sayfa** azaldıysa seyahat öncesi yenilemek iyi fikirdir; Tayland giriş–çıkış damgaları sayfaları hızlı doldurur.
$ta_vize$,
  excerpt = $ta_exc$2026 yılı itibarıyla Türkiye Cumhuriyeti pasaportu sahipleri, Tayland'a turistik amaçlı girişlerde 60 güne kadar vizeden muaftır. Pasaportta en az 6 ay geçerlilik, dönüş bileti ve konaklama kanıtı yanınızda olsun.$ta_exc$
WHERE lang = 'tr'
  AND slug = 'tayland-vize-muafiyeti-giris-rehberi';

-- İsteğe bağlı: yalnız tayland + vize ile sınırla
-- AND lower(btrim(region)) = 'tayland'
-- AND lower(btrim(category)) = 'vize';
