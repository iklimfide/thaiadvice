/**
 * Kurumsal sayfa: /tr/genel/kurumsal/arif-guvenc-kimdir
 * Supabase’e tek satır yazar (supabase/patches/insert_arif_guvenc_kimdir_page.sql ile aynı içerik).
 *
 *   npx tsx scripts/seed-arif-guvenc-kimdir.ts
 *
 * Ortam: .env.local — NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeSupabaseProjectUrl } from "../lib/supabase/net";

function loadEnvFiles() {
  for (const name of [".env", ".env.local"]) {
    const p = resolve(process.cwd(), name);
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (key) process.env[key] = val;
    }
  }
}

const CONTENT = `
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
`.trim();

const MEDIA_SEO = `GÖRSEL: Bir yanda modern bir tarım arazisi (İklim Fide), diğer yanda Tayland'ın ikonik bir şehir manzarası ve ortada bir dizüstü bilgisayarla analiz yapan Arif GÜVENÇ kolajı.
ALT-TEXT: Arif GÜVENÇ vizyonu, İklim Fide, Woxsify ve Ne Getirmiş projeleri.`;

async function main() {
  loadEnvFiles();
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!rawUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL eksik (.env.local).");
    process.exit(1);
  }
  const key = service || anon;
  if (!key) {
    console.error("SUPABASE_SERVICE_ROLE_KEY veya anon key gerekli.");
    process.exit(1);
  }
  if (!service) {
    console.warn(
      "Uyarı: service role yok; RLS yazmayı engelliyorsa upsert başarısız olur."
    );
  }

  const supabase = createClient(normalizeSupabaseProjectUrl(rawUrl), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const row = {
    lang: "tr" as const,
    category: "kurumsal",
    slug: "arif-guvenc-kimdir",
    title: "Biz Kimiz? Bir Mühendisin Bilgi Mirası ve Yolculuğu | Arif GÜVENÇ",
    content: CONTENT,
    excerpt:
      "27 yıllık Ziraat Mühendisi disiplini, İklim Fide tecrübesi ve Woxsify vizyonuyla Tayland rehberliğinin arkasındaki gerçek hikaye.",
    author: "Arif GÜVENÇ",
    region: "genel",
    related_slugs: [] as string[],
    is_hidden: false,
    media_seo_text: MEDIA_SEO,
  };

  let { error } = await supabase.from("questions").upsert(row, {
    onConflict: "lang,region,category,slug",
  });

  if (error) {
    await supabase
      .from("questions")
      .delete()
      .eq("lang", "tr")
      .eq("region", "genel")
      .eq("category", "kurumsal")
      .eq("slug", "arif-guvenc-kimdir");
    const second = await supabase.from("questions").insert(row);
    error = second.error;
  }

  if (error) {
    console.error("Kayıt hatası:", error.message);
    process.exit(1);
  }

  console.log("Tamam: /tr/genel/kurumsal/arif-guvenc-kimdir kaydedildi.");
  setTimeout(() => process.exit(0), 100);
}

main().catch((e) => {
  console.error(e);
  setTimeout(() => process.exit(1), 100);
});
