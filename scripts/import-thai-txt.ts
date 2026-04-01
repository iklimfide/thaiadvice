/**
 * thai.txt (YAML benzeri frontmatter + markdown) → Supabase `questions`
 *
 * İki üst bilgi biçimi:
 *   A) Klasik: --- … --- ile çevrili blok, ardından gövde (### [DİL KODU: tr], # başlık, **SLUG:** …).
 *   B) Düz: --- yok; satırlar SLUG:, CATEGORY_ID:, REGION: … (yalnız A–Z ve _ ile başlayan anahtarlar),
 *      ardından [DİL KODU: TR] veya ### [DİL KODU: tr], başlık (# veya düz ilk satır), isteğe bağlı
 *      "Hızlı Cevap (Snippet):" paragrafı.
 *
 * Kullanım:
 *   npx tsx scripts/import-thai-txt.ts [dosya-yolu]
 *
 * Şu biçimler doğrudan `import-thai-export-txt` akışına yönlendirilir:
 * — `## 1. HEADER (META DATA)` + `---` (klasik export)
 * — `---` YAML + `## 1. SNIPPET` / `## 2. BODY` / uzman / `## 4. GÖRSEL` (Word şablonu)
 *
 * Varsayılan dosya: kullanıcı Downloads yolu (yoksa ./thai.txt denenir)
 *
 * Ortam (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (önerilir; yoksa anon + RLS insert gerekir)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeSupabaseProjectUrl } from "../lib/supabase/net";
import { normalizeQuestionCategorySlug } from "../lib/data/question-categories";
import { replacePerlamareWithArifGuvenc } from "../lib/format/replace-perlamare-in-text";
import {
  logImportArticlePageUrl,
  resolveImportArticleLang,
} from "./import-thai-lang-meta";

/** Next.js .env.local yüklemeden tsx çalışınca değişkenler boş kalır */
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

type ParsedArticle = {
  id: string | null;
  category: string;
  region: string;
  imageUrl: string | null;
  author: string;
  lang: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseFrontmatter(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+):\s*(.*)$/i);
    if (m) out[m[1].toUpperCase()] = m[2].trim();
  }
  return out;
}

/** BOM ve baştaki boş satırlar; ardından ilk makale --- ile başlamalı */
function normalizeImportPreamble(raw: string): string {
  let s = raw.replace(/^\uFEFF/, "");
  s = s.replace(/^\u200B+/, "");
  s = s.replace(/^(\s*\r?\n)+/, "");
  s = s.trimStart();
  return s.trimEnd();
}

/** Perlamare Word/export şablonu — yalnızca import-thai-export-txt.ts ile işlenmeli */
function isPerlamareExportFormat(s: string): boolean {
  const head = s.slice(0, 6000);
  return /##\s*1\.\s*HEADER\s*\(?\s*META\s*DATA\s*\)?/i.test(head);
}

/**
 * Birden fazla makale: ---\nfrontmatter\n---\nbody tekrarlar.
 * Markdown’daki yatay çizgi (tek başına ---) ayırıcı sayılmaz; sonraki blok yalnızca
 * --- sonrasında KEY: (örn. ID:, CATEGORY_ID:) ile başlıyorsa yeni makaledir.
 *
 * Alternatif (tek makale): --- olmadan üstte yalnızca BÜYÜK_HARF ANAHTARLAR (örn. SLUG:, CATEGORY_ID:),
 * ardından gövde — [DİL KODU: tr] ve düz metin başlık kabul edilir.
 * "I. Header (Meta Data)" gibi ön satırlar atlanır; meta bloğu tanınan ilk anahtarla başlar.
 *
 * UYARI: `## 1. HEADER (META DATA)` ile başlayan Perlamare export dosyaları bu betikle
 * KULLANILMAMALI — gövde `---` ile başlar, başlık bozulur, SNIPPET/BODY ham kalır.
 * Bunun için: npm run import:thai-export
 */
const PLAIN_META_KEYS = new Set([
  "ID",
  "CATEGORY_ID",
  "CATEGORY",
  "REGION",
  "SLUG",
  "AUTHOR",
  "IMAGE_URL",
  "LANG",
  "LANGUAGE",
  "LANGUAGE_CODE",
  "DIL",
  "DIL_KODU",
]);

function extractPlainFrontmatter(s: string): { fm: string; body: string } | null {
  const lines = s.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    if (raw.trim() === "") {
      i++;
      continue;
    }
    const m = raw.match(/^([A-Z][A-Z0-9_]*)\s*:\s*(.*)$/);
    if (m && PLAIN_META_KEYS.has(m[1].toUpperCase())) break;
    i++;
  }
  if (i >= lines.length) return null;

  const metaLines: string[] = [];
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }
    const m = line.match(/^([A-Z][A-Z0-9_]*)\s*:\s*(.*)$/);
    if (!m) break;
    metaLines.push(`${m[1]}: ${m[2].trim()}`);
    i++;
  }
  if (metaLines.length === 0) return null;
  const body = lines.slice(i).join("\n").trim();
  return { fm: metaLines.join("\n"), body };
}

function splitDocuments(raw: string): { fm: string; body: string }[] {
  const out: { fm: string; body: string }[] = [];
  let s = normalizeImportPreamble(raw);
  if (isPerlamareExportFormat(s)) {
    throw new Error(
      "Bu dosya Perlamare export biçimi; `main()` önce `runThaiExportImport` " +
        "çağırmalı. (Dahili: splitDocuments’a export ham metni düşmemeli.)"
    );
  }
  if (!s.startsWith("---")) {
    const plain = extractPlainFrontmatter(s);
    if (plain) return [plain];
    const head = s.slice(0, 120).replace(/\r?\n/g, "\\n");
    throw new Error(
      "Dosya ya --- ile çevrili YAML bloğu ile başlamalı ya da (isteğe bağlı ön başlıktan sonra) " +
        "ID:/CATEGORY_ID:/SLUG: gibi tanınan meta alanları içermeli.\n" +
        `(İlk 120 karakter: ${head || "(boş)"})`
    );
  }
  while (s.length) {
    if (!s.startsWith("---")) {
      throw new Error("Beklenmeyen içerik: " + s.slice(0, 60));
    }
    s = s.replace(/^---\s*\r?\n/, "");
    const close = s.search(/\r?\n---\s*\r?\n/);
    if (close === -1) {
      throw new Error("Frontmatter kapanışı (---) bulunamadı.");
    }
    const fm = s.slice(0, close).trim();
    s = s.slice(close).replace(/^\r?\n---\s*\r?\n/, "");
    const nextArticle = s.search(/\r?\n---\s*\r?\n\s*[A-Z_]+:/);
    const body = (nextArticle === -1 ? s : s.slice(0, nextArticle)).trim();
    s =
      nextArticle === -1
        ? ""
        : s.slice(nextArticle).replace(/^\r?\n/, "").trimStart();
    if (fm || body) out.push({ fm, body });
  }
  return out;
}

function parseArticleBody(
  body: string,
  opts?: { slugFromMeta?: string }
): Omit<ParsedArticle, "id" | "category" | "region" | "imageUrl" | "author"> {
  let rest = body.trim();

  const langHeading = rest.match(/^###\s*\[\s*DİL KODU:\s*(\w+)\s*\]\s*\r?\n?/i);
  const langBracket = rest.match(/^\[\s*DİL KODU:\s*(\w+)\s*\]\s*\r?\n/i);
  const langM = langHeading || langBracket;
  const lang = langM ? langM[1].toLowerCase() : "tr";
  if (langM) rest = rest.slice(langM.index! + langM[0].length).trim();

  let title: string;
  const titleHash = rest.match(/^#\s+(.+?)\s*$/m);
  if (titleHash && titleHash.index === 0) {
    title = titleHash[1].trim();
    rest = rest.slice(titleHash[0].length).replace(/^\r?\n?/, "").trim();
  } else {
    const first = rest.match(/^([^\r\n]+)/);
    if (!first) throw new Error("Başlık yok (# veya ilk satır).");
    title = first[1].trim();
    rest = rest.slice(first[0].length).replace(/^\r?\n?/, "").trim();
  }

  let slug: string;
  const slugM = rest.match(/^\*\*SLUG:\*\*\s*(.+)$/im);
  if (slugM) {
    slug = slugM[1].trim();
    rest = rest.replace(/^\*\*SLUG:\*\*\s*.+\r?\n?/im, "").trim();
  } else if (opts?.slugFromMeta?.trim()) {
    slug = opts.slugFromMeta.trim();
  } else {
    throw new Error("**SLUG:** satırı veya frontmatter SLUG gerekli.");
  }

  let excerpt: string | null = null;
  const quickM = rest.match(
    />\s*\*\*Hızlı Cevap:\*\*\s*([\s\S]+?)(?=\r?\n\r?\n|\r?\n##|\r?\n###\s*\[\s*DİL|$)/
  );
  if (quickM) {
    excerpt = quickM[1]
      .replace(/\*\*/g, "")
      .replace(/\r?\n/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 2000);
    rest = rest.slice(0, quickM.index!) + rest.slice(quickM.index! + quickM[0].length);
    rest = rest.replace(/^\s*\r?\n/, "").trim();
  } else {
    const snipLabel = rest.match(/\bHızlı\s+Cevap\s*\(\s*Snippet\s*\)\s*:\s*/i);
    if (snipLabel) {
      const start = snipLabel.index! + snipLabel[0].length;
      let tail = rest.slice(start);
      const end = tail.search(/\r?\n\r?\n/);
      const snippetText = (end === -1 ? tail : tail.slice(0, end)).trim();
      excerpt = snippetText.replace(/\s+/g, " ").slice(0, 2000);
      const removedEnd = end === -1 ? rest.length : start + end + 2;
      rest = (rest.slice(0, snipLabel.index!) + rest.slice(removedEnd)).trim();
    }
  }

  const content = rest.trim();
  if (!content) throw new Error("İçerik boş.");

  return { lang, slug, title, excerpt, content };
}

function resolveImageUrl(raw: string | null | undefined): string | null {
  if (raw == null || !String(raw).trim()) return null;
  const s = String(raw).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const base = process.env.IMPORT_SITE_ORIGIN?.replace(/\/$/, "") ?? "";
  if (base && s.startsWith("/")) return `${base}${s}`;
  return s;
}

function getClient() {
  /* Bu scriptte ensureNodeFetchPrefersIpv4 yok: Windows + tsx çıkışında libuv assertion tetikleyebiliyor. */
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!rawUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL gerekli.");
  const url = normalizeSupabaseProjectUrl(rawUrl);
  const key = service || anon;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY veya anon key gerekli.");
  if (!service) {
    console.warn(
      "Uyarı: service role yok; RLS questions INSERT engelliyorsa kayıt düşmez."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function defaultInputPath(): string {
  const win = "C:\\Users\\iklim\\Downloads\\thai\\thai.txt";
  if (existsSync(win)) return win;
  const local = resolve(process.cwd(), "thai.txt");
  if (existsSync(local)) return local;
  return win;
}

async function main() {
  loadEnvFiles();
  const filePath = resolve(process.argv[2] ?? defaultInputPath());
  if (!existsSync(filePath)) {
    console.error("Dosya yok:", filePath);
    process.exit(1);
  }

  const raw = readFileSync(filePath, "utf8");

  const { isYamlNumberedSectionExport, runThaiExportImport } = await import(
    "./import-thai-export-txt.js"
  );
  if (isPerlamareExportFormat(raw) || isYamlNumberedSectionExport(raw)) {
    const label = isPerlamareExportFormat(raw)
      ? "## 1. HEADER (META DATA) + --- blokları"
      : "YAML üst bilgi + ## 1. SNIPPET / BODY / uzman / GÖRSEL";
    console.log(`${label} — import-thai-export akışı.\n`);
    const code = await runThaiExportImport(filePath);
    setTimeout(() => process.exit(code), 150);
    return;
  }

  const docs = splitDocuments(raw);
  if (docs.length === 0) {
    console.error("Parse edilen makale yok.");
    process.exit(1);
  }

  const supabase = getClient();
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < docs.length; i++) {
    const { fm, body } = docs[i];
    const meta = parseFrontmatter(fm);
    try {
      const parsedBody = parseArticleBody(body, { slugFromMeta: meta.SLUG });
      const lang = resolveImportArticleLang(meta, parsedBody.lang);
      const parsed = { ...parsedBody, lang };
      const rawCat = meta.CATEGORY_ID || meta.CATEGORY || "";
      const category =
        normalizeQuestionCategorySlug(rawCat) ?? rawCat.trim();
      if (!category) throw new Error("CATEGORY_ID boş.");

      const region = (meta.REGION || "tayland").trim();
      const author = (meta.AUTHOR || "Arif GÜVENÇ").trim();
      const imageUrl = resolveImageUrl(meta.IMAGE_URL);
      let id: string | null = null;
      if (meta.ID && UUID_RE.test(meta.ID.trim())) id = meta.ID.trim();

      const row = {
        ...(id ? { id } : {}),
        lang: parsed.lang,
        category,
        slug: parsed.slug,
        title: replacePerlamareWithArifGuvenc(parsed.title),
        content: replacePerlamareWithArifGuvenc(parsed.content),
        excerpt: parsed.excerpt
          ? replacePerlamareWithArifGuvenc(parsed.excerpt)
          : null,
        author,
        image_url: imageUrl,
        region,
        related_slugs: [] as string[],
      };

      const { error } = await supabase.from("questions").upsert(row, {
        onConflict: "lang,region,category,slug",
      });

      if (error) {
        console.error(`[${i + 1}] Hata (${parsed.slug}):`, error.message);
        fail++;
      } else {
        console.log(`[${i + 1}] Tamam: ${parsed.slug} (${category}, ${parsed.lang})`);
        logImportArticlePageUrl(parsed.lang, region, category, parsed.slug);
        ok++;
      }
    } catch (e) {
      console.error(`[${i + 1}] Parse/kayıt:`, e);
      fail++;
    }
  }

  console.log(`Bitti. Başarılı: ${ok}, hatalı: ${fail}`);
  const code = fail > 0 ? 1 : 0;
  /* tsx + Windows: anında exit bazen libuv "UV_HANDLE_CLOSING" assert; kısa gecikme ile kaçın. */
  setTimeout(() => process.exit(code), 150);
}

main().catch((e) => {
  console.error(e);
  setTimeout(() => process.exit(1), 150);
});
