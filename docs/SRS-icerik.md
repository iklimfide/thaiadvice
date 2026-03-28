# Yazılım Gereksinim Spesifikasyonu (SRS) — İçerik Yönetimi

**Proje:** ThaiAdvice.com  
**Kapsam:** Coğrafi hiyerarşi, makaleler (sorular), mekânlar, SSS, içe aktarma ve yayın öncesi akışları  
**Sürüm:** 1.0  
**Tarih:** 2026-03-27  

---

## 1. Giriş

### 1.1 Amaç

Bu belge, ThaiAdvice uygulamasında **ziyaretçiye sunulan içeriğin** kaynağı, yapısı, güncellenmesi ve arama motorlarına açılması ile ilgili işlevsel ve veri gereksinimlerini tanımlar. Teknik mimari (Next.js, Supabase) yalnızca gereksinimleri karşılamak üzere referans olarak geçer.

### 1.2 Kapsam

| Dahil | Hariç |
|--------|--------|
| Bölgeler, alt bölgeler, mekânlar, makale (questions) | Ödeme, kullanıcı kaydı (ziyaretçi) |
| SSS (FAQ) girişleri | Tam özellikli CMS ürünü |
| Ana sayfa arama, sitemap/robots | Çoklu dil içerik yönetimi (şu an yalnızca tr/en rotaları) |
| Master satır içi düzenleme, thai.txt içe aktarma | Üçüncü parti editör entegrasyonu |
| İçerik önerisi formu (article_submissions) | Moderasyon iş akışı detayları (panel dışı süreç) |

### 1.3 Tanımlar

- **Makale / soru (`questions`):** Tayland rehberi metinleri; URL’de kategori segmenti ve slug ile adreslenir.  
- **Bölge (`regions`):** Üst coğrafi katman (ör. tayland).  
- **Alt bölge (`sub_regions`):** Bölgeye bağlı alt birim; mekânların bağlandığı seviye.  
- **Mekân (`places`):** Alt bölgeye bağlı POI; tanıtım metni ve görseller içerir.  
- **Master:** Yetkili e-posta ile oturum açan; satır içi alan güncelleme ve (tanımlı yerlerde) yeni alt bölge oluşturma yetkisi.  
- **Kanonik kategori slug:** Menü ve URL’de kullanılan sabit kategori listesi ile eşleşen değer.

---

## 2. Paydaşlar ve hedefler

| Paydaş | Beklenti |
|--------|-----------|
| Ziyaretçi | Güvenilir, okunaklı, hızlı; arama ve net URL hiyerarşisi |
| Editör / içerik | Dosya veya panel benzeri akışla yayın; görsel ve metin güncelleme |
| Arama motorları | `robots.txt`, `sitemap.xml`, tutarlı canonical yapı |

---

## 3. Veri modeli (içerik varlıkları)

### 3.1 `regions`

| Alan | Zorunlu | Açıklama |
|------|---------|-----------|
| id | Evet | Birincil anahtar (metin) |
| slug | Evet | URL segmenti; benzersiz |
| name, description, image | Evet (image boş string olabilir) | Görünen ad, açıklama, kart/kapak görseli |

### 3.2 `sub_regions`

| Alan | Zorunlu | Açıklama |
|------|---------|-----------|
| id, region_id, name, slug | Evet | Üst bölgeye FK |
| description, image | Evet (image migrasyon sonrası) | Kart ve detay |

**Kısıt:** Aynı `region_id` altında `slug` çakışması içe aktarma ve UI’da engellenmeli.

### 3.3 `places`

| Alan | Zorunlu | Açıklama |
|------|---------|-----------|
| id, region_id, sub_region_id, slug, name | Evet | |
| price_level, rating, image, ai_intro | Evet | Fiyat seviyesi ($ / $$ / $$$), puan, görsel, markdown tanıtım |

### 3.4 `questions` (makaleler)

| Alan | Zorunlu | Açıklama |
|------|---------|-----------|
| lang | Evet | `tr`, `en`, … |
| region | Evet | URL’deki bölge segmenti ile uyumlu metin (ör. `tayland`) |
| category | Evet | Serbest metin veya alias; kanonik sluga indirgenir |
| slug | Evet | URL son segmenti |
| title, content | Evet | Markdown gövde |
| excerpt | Hayır | Özet / snippet |
| author, image_url, related_slugs, created_at | Tanımlı şema | |

**Benzersizlik:** `(lang, region, category, slug)` upsert çakışması (uygulama tarafı).

### 3.5 `faq_entries` / `faq_items`

Kategori alanı sayfa bağlamında bölge / alt bölge / mekân slug’ı ile eşleştirilir; sıra `sort_order` ile.

### 3.6 `article_submissions`

Ziyaretçi önerileri; moderasyon sonrası `questions` veya ayrı süreç — bu SRS’de yalnızca “kayıt oluşur” düzeyinde.

---

## 4. İşlevsel gereksinimler

### 4.1 URL ve navigasyon

- **FR-URL-1:** Dil kökü: `/{lang}` (desteklenen: `tr`, `en`).  
- **FR-URL-2:** Bölge: `/{lang}/{regionSlug}`.  
- **FR-URL-3:** Alt bölge: `/{lang}/{regionSlug}/{subSlug}`.  
- **FR-URL-4:** Makale: `/{lang}/{regionKey}/{categorySlug}/{articleSlug}`.  
- **FR-URL-5:** Mekân: `/{lang}/{regionSlug}/{subSlug}/{placeSlug}` (çakışma çözümü: soru/mekân çözümleme sırası uygulama kurallarına tabi).

### 4.2 Okuma ve listeleme

- **FR-LIST-1:** Ana sayfada seçilen dil için makale listesi; isteğe bağlı kategori sorgu parametresi.  
- **FR-LIST-2:** Arama: `q` parametresi ile başlık, içerik ve özet içinde kelime eşlemesi (dil duyarlı küçük harf).  
- **FR-LIST-3:** Bölgeler ve alt bölgeler listelenir; görseller varsa kartlarda gösterilir.  
- **FR-DET-1:** Makale detayında başlık, özet (varsa), kapak görseli (varsa), markdown gövde, ilgili slug listesi (varsa), bağlamsal SSS.  
- **FR-DET-2:** Mekân detayında ad, fiyat, puan, görsel, markdown tanıtım, SSS.

### 4.3 SEO

- **FR-SEO-1:** `/robots.txt` üretilir; `/admin/` ve `/api/` disallow; `Sitemap` ve isteğe bağlı `Host` bildirimi.  
- **FR-SEO-2:** `/sitemap.xml` üretilir; statik dil kökleri + Supabase’ten gelen bölge, alt bölge, mekân ve makale URL’leri; makul `revalidate` ile önbellek.  
- **FR-SEO-3:** Sayfa metadata’sında başlık, açıklama, Open Graph görselleri (varsa).

### 4.4 Master (yetkili) düzenleme

- **FR-M-1:** Master oturumu olmadan düzenleme arayüzü görünmez.  
- **FR-M-2:** Makale: başlık, içerik, özet, yazar, kategori, bölge kodu, kapak görseli (URL veya dosya), ilişkili slug’lar.  
- **FR-M-3:** Bölge / alt bölge: ad, açıklama, görsel (URL veya dosya).  
- **FR-M-4:** Mekân: ad, görsel, tanıtım, fiyat seviyesi, puan.  
- **FR-M-5:** Bölge sayfasında yeni alt bölge oluşturma (ad, slug, açıklama); aynı bölgede slug tekil.  
- **FR-M-6:** Güncelleme sonrası ilgili sayfaların yenilenmesi (revalidate) beklenir.

### 4.5 Toplu / dosya içe aktarma

*(Bu bölüm `scripts/import-thai-txt.ts` ile uyumludur; sapma varsa önce kod, sonra SRS güncellenir.)*

- **FR-IMP-1:** `thai.txt` benzeri dosyadan `questions` **upsert** (`onConflict: lang, region, category, slug`); ortamda `SUPABASE_SERVICE_ROLE_KEY` önerilir, yoksa anon + uygun RLS INSERT. Betik `.env` / `.env.local` yükler; `NEXT_PUBLIC_SUPABASE_URL` ve anahtar zorunludur.  
- **FR-IMP-2:** Desteklenen üst bilgi biçimleri:  
  - **Klasik (çoklu makale):** Dosya `---` ile başlar; blok `---` ile biter; gövde tekrarlanır. Gövde: `### [DİL KODU: xx]` veya köşeli `[DİL KODU: xx]`; başlık `# …` **veya** dil satırından sonraki **ilk metin satırı**; slug gövdede `**SLUG:**` **veya** YAML’da `SLUG:` (frontmatter `parseFrontmatter` ile). Özet: blok alıntı `> **Hızlı Cevap:**` veya metin `Hızlı Cevap (Snippet):` (ilk paragraf `excerpt`, gövdeden çıkarılır).  
  - **Düz (tek makale dosyası):** `---` yok. UTF-8 BOM ve baş boşluklar atılır; `I. Header (Meta Data)` gibi ön satırlar atlanır. Meta bloğu, şu anahtarlardan **biriyle** başlamalı: `ID`, `CATEGORY_ID`, `CATEGORY`, `REGION`, `SLUG`, `AUTHOR`, `IMAGE_URL`. Ardından ardışık `ANAHTAR: değer` satırları (boş satırlar serbest) toplanır; `KEY` deseni `[A-Z][A-Z0-9_]*` — meta bölümü, bu desene uymayan ilk satırda biter. Gövde klasik ile aynı kurallar; slug çoğunlukla üstteki `SLUG:` ile verilir.  
- **FR-IMP-3:** **Kategori:** `CATEGORY_ID` veya `CATEGORY` → `normalizeQuestionCategorySlug`; sonuç `null` ve metin boş değilse **ham `trim()` değer** veritabanına yazılır; tamamen boşsa **hata**. (URL’de kanonik slug, sitedeki çözümleme kurallarına bağlı kalabilir.)  
- **FR-IMP-4:** **IMAGE_URL:** Mutlak `http(s)://` olduğu gibi; göreli `/…` yolu için isteğe bağlı `IMPORT_SITE_ORIGIN` (betik ortamı) ile tam URL birleştirilir.  
- **FR-IMP-5:** **ID:** Geçerli UUID ise upsert satırına eklenir; yoksa Supabase yeni uuid üretir.  
- **FR-IMP-6:** Varsayılan dosya yolu betik içinde tanımlıdır; CLI’da `npx tsx scripts/import-thai-txt.ts [dosya-yolu]` ile geçersiz kılınır.

### 4.6 Erişilebilirlik (içerik sunumu)

- **FR-A11Y-1:** Anlamlı başlık hiyerarşisi (sayfa h1 + markdown başlıkları).  
- **FR-A11Y-2:** Breadcrumb ve gizli bölüm başlıkları (sr-only) tanımlı sayfalarda.

---

## 5. İşlevsel olmayan gereksinimler

- **NFR-PERF-1:** Ana liste ve sitemap için aşırı N+1 sorgu sayısı kabul edilebilir sınırlarda tutulmalı (iyileştirme borcu).  
- **NFR-AVAIL-1:** Supabase ortam değişkenleri eksikse site çekirdeği mümkün olduğunca kontrollü hata vermeli (üretimde env zorunlu).  
- **NFR-SEC-1:** Genel okuma RLS ile; yazma master/service role ile.  
- **NFR-MAINT-1:** Şema değişiklikleri için SQL migrasyon dosyaları (ör. `sub_regions.image`) versiyon kontrolünde tutulur.

---

## 6. Kabul kriterleri (özet)

1. Desteklenen tüm içerik URL’leri 404 olmadan ve doğru şablonla açılır.  
2. Ana sayfa arama ve kategori filtresi tutarlı sonuç döner.  
3. `robots.txt` ve `sitemap.xml` üretim domain’i ile doğru mutlak URL içerir.  
4. Master ile yapılan görsel/metin güncellemesi yenilemeden veya kısa süre içinde yansır.  
5. Geçerli `thai.txt` örneği tek komutla en az bir `questions` satırını upsert eder.  
6. Yeni alt bölge oluşturma sonrası liste ve detay URL’i erişilebilir.

---

## 7. Açık noktalar ve borçlar

- Çok büyük içerik hacminde sitemap bölünmesi (sitemap index).  
- İçe aktarılan markdown’da otomatik `##` başlık üretimi (editör politikası).  
- `en` içerik stoğu ile `tr` paritesi iş kuralı olarak netleştirilmeli.  

---

## Ek A — SRS ↔ import betiği hizalama özeti

| Konu | SRS (4.5) | Betik |
|------|-----------|--------|
| Hedef tablo | `questions` | `questions` |
| Çakışma | `(lang, region, category, slug)` | `upsert` aynı |
| Klasik çoklu makale | `---` / `---` | `splitDocuments` döngüsü |
| Düz tek makale | Ön başlık + tanınan anahtarlar | `extractPlainFrontmatter` + `PLAIN_META_KEYS` |
| Dil | `### [DİL KODU:]` veya `[DİL KODU:]` | `parseArticleBody` |
| Başlık | `#` veya ilk satır | Aynı |
| Slug | `**SLUG:**` veya meta `SLUG` | `slugFromMeta` |
| Özet | Blockquote veya Snippet | `parseArticleBody` |
| Kategori | Normalize veya ham | `normalizeQuestionCategorySlug ?? raw` |
| Göreli görsel | `IMPORT_SITE_ORIGIN` | `resolveImageUrl` |

Önceki SRS sürümünde “düz biçim” tek cümlede özetlenmişti; betikteki **ön başlık atlama**, **tanınan ilk meta anahtarı**, **tek dosyada tek düz makale** ve **`IMPORT_SITE_ORIGIN`** açık yazılmamıştı — 4.5 ve bu tablo ile giderildi.

---

*Bu belge, mevcut kod tabanı ve konuşulan özelliklerle uyumlu olacak şekilde yazılmıştır; ürün sahibi onayı ile öncelik ve kapsam güncellenebilir.*
