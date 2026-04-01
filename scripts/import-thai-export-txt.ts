/**
 * Export biçimleri:
 * — `## 1. HEADER (META DATA)` + `---` blokları (klasik)
 * — `---` YAML (TITLE, SLUG, …) + `## 1. SNIPPET` / `## 2. BODY` / uzman / GÖRSEL (Word şablonu)
 *
 * Kullanım:
 *   npx tsx scripts/import-thai-export-txt.ts [dosya-yolu]
 *
 * Varsayılan: C:\Users\iklim\Downloads\thai\thai.txt (yoksa ./thai-export.txt)
 *
 * Ortam: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (önerilir)
 *
 * Aynı slug+lang+region için satır zaten varsa: yalnızca `content`, `excerpt`,
 * (dosyada 5. bölüm varsa) `media_seo_text`, isteğe bağlı HEADER’daki
 * `STATUS` / `PUBLISH_AT` / `YAYIN_TARIHI` (yayın zamanı) güncellenir. Yoksa tam upsert.
 *
 * Yayın zamanı örneği (Türkiye saati): `STATUS: 2026-04-02 09:00`
 *
 * `## 5. GÖRSEL (MEDIA)…` makale gövdesine eklenmez; yalnızca `media_seo_text`
 * sütununa yazılır (JSON-LD / og:image:alt ile botlar).
 *
 * İlk kurulum: `supabase/patches/add_questions_media_seo_text.sql` → Supabase SQL Editor.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { normalizeSupabaseProjectUrl } from "../lib/supabase/net";
import { normalizeQuestionCategorySlug } from "../lib/data/question-categories";
import {
  metaPublishAtRaw,
  parseImportStatusPublishAt,
} from "../lib/format/parse-import-status-publish-at";
import { replacePerlamareWithArifGuvenc } from "../lib/format/replace-perlamare-in-text";
import {
  logImportArticlePageUrl,
  resolveImportArticleLang,
} from "./import-thai-lang-meta";

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

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MEDIA_SEO_PATCH_HINT =
  "Sütun yok: Supabase Dashboard → SQL → şunu çalıştırın:\n" +
  "ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS media_seo_text text;";

function isMissingMediaSeoColumnError(message: string): boolean {
  return (
    /media_seo_text/i.test(message) &&
    (/schema cache/i.test(message) || /could not find.*column/i.test(message))
  );
}

/** Satır/içerik sonundaki [cite: 1] veya [cite: 1, 2] */
function stripCites(s: string): string {
  return s.replace(/\s*\[cite:\s*[\d,\s]+\]/gi, "");
}

function parseMetaBlock(headerBody: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of headerBody.split(/\r?\n/)) {
    const cleaned = stripCites(line).trim();
    if (!cleaned) continue;
    const m = cleaned.match(/^([A-Z_][A-Z0-9_]*)\s*:\s*(.+)$/i);
    if (m) out[m[1].toUpperCase()] = m[2].trim();
  }
  return out;
}

type SectionKey = "header" | "snippet" | "body" | "expert" | "media";

function classifySectionHeading(line: string): SectionKey | null {
  const u = line.toLocaleUpperCase("tr-TR");
  if (u.includes("HEADER") && u.includes("META")) return "header";
  if (u.includes("SNIPPET") || u.includes("HIZLI CEVAP")) return "snippet";
  if (u.includes("BODY") || u.includes("ANA MAKALE")) return "body";
  if (u.includes("PERLAMARE") || u.includes("EXPERT INSIGHT")) return "expert";
  if (
    u.includes("ARIF") &&
    (u.includes("GÜVENÇ") ||
      u.includes("GUVENÇ") ||
      u.includes("GÖRÜŞ") ||
      u.includes("GORUS") ||
      u.includes("TAVSİYE") ||
      u.includes("TAVSIYE"))
  )
    return "expert";
  if (u.includes("GÖRSEL") || u.includes("GORSEL") || u.includes("MEDIA"))
    return "media";
  return null;
}

/**
 * Bloklar: ## N. BAŞLIK\niçerik — ardından \n---\n ile ayrılır.
 */
function parseExportSections(raw: string): Partial<Record<SectionKey, string>> {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const parts = text.split(/\n---\s*\n/);
  const out: Partial<Record<SectionKey, string>> = {};

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const m = trimmed.match(/^##\s*\d+\.\s*([^\n]+)\n([\s\S]*)$/);
    if (!m) continue;
    const key = classifySectionHeading(m[1].trim());
    if (!key) continue;
    out[key] = m[2].trim();
  }
  return out;
}

/** Word çıktısı: `## ## 1.` → `### 1.` */
function normalizeExportedBodyMarkdown(s: string): string {
  let t = s.replace(/\r\n/g, "\n");
  t = t.replace(/^##\s*##\s+/gm, "### ");
  t = t.replace(/\n##\s*##\s+/g, "\n### ");
  t = t.replace(/^##\s*###\s+/gm, "#### ");
  t = t.replace(/\n##\s*###\s+/g, "\n#### ");
  return t;
}

function fixLegacyCorporateLinks(s: string): string {
  return s.replace(
    /\/tr\/kurumsal\/biz-kimiz\b/g,
    "/tr/genel/kurumsal/arif-guvenc-kimdir"
  );
}

/** GÖRSEL bölümü: yıldızlı satırları düz SEO metnine çevir (okuyucuya gösterilmez) */
function formatMediaSeoSection(s: string): string {
  return s
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\*\s+/, ""))
    .join("\n")
    .trim();
}

function parseSimpleYamlMeta(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of block.split(/\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (m) out[m[1].toUpperCase()] = m[2].trim();
  }
  return out;
}

/**
 * `---` YAML + ardından `## 1. …` numaralı bölümler (içeride `---` ayraçları olsa bile güvenli).
 * Klasik `### [DİL KODU]` makaleleri veya `## 1. HEADER` ile başlayanlar için null döner.
 */
function tryParseYamlFrontmatterAndNumberedSections(
  raw: string
): { meta: Record<string, string>; sections: Partial<Record<SectionKey, string>> } | null {
  const text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) return null;
  const rest0 = m[2].replace(/^\uFEFF/, "").trimStart();
  if (/^###\s*\[\s*DİL\s*KODU/i.test(rest0)) return null;
  if (/^##\s*1\.\s*HEADER\s*\(?\s*META\s*DATA/i.test(rest0)) return null;
  if (!/^##\s*\d+\.\s/m.test(rest0)) return null;

  const meta = parseSimpleYamlMeta(m[1]);
  const lines = rest0.split("\n");
  const chunks: { headingTitle: string; lines: string[] }[] = [];
  let cur: { headingTitle: string; lines: string[] } | null = null;
  for (const line of lines) {
    const hm = line.match(/^##\s*\d+\.\s+(.+)$/);
    if (hm) {
      if (cur) chunks.push(cur);
      cur = { headingTitle: hm[1].trim(), lines: [] };
    } else if (cur) cur.lines.push(line);
  }
  if (cur) chunks.push(cur);

  const sections: Partial<Record<SectionKey, string>> = {};
  for (const ch of chunks) {
    const key = classifySectionHeading(ch.headingTitle);
    if (!key || key === "header") continue;
    const body = ch.lines.join("\n").trim();
    sections[key] = body;
  }
  return { meta, sections };
}

/** `import-thai-txt` önce bunu dener; true ise `runThaiExportImport` çağrılır */
export function isYamlNumberedSectionExport(raw: string): boolean {
  return tryParseYamlFrontmatterAndNumberedSections(raw) != null;
}

function primaryLangFromHreflang(h: string | undefined): string {
  if (!h) return "tr";
  const first = h.split(",")[0]?.trim().toUpperCase();
  if (!first) return "tr";
  const map: Record<string, string> = {
    TR: "tr",
    EN: "en",
    NL: "nl",
    DE: "de",
    ES: "es",
  };
  return map[first] ?? first.toLowerCase().slice(0, 2);
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map(
      (w) =>
        w.charAt(0).toLocaleUpperCase("tr-TR") +
        w.slice(1).toLocaleLowerCase("tr-TR")
    )
    .join(" ");
}

/** import-thai-txt yanlışlıkla yazılmış bozuk başlıkları tespit eder */
function titleNeedsRepair(raw: string | null | undefined): boolean {
  const s = (raw ?? "").trim();
  if (!s) return true;
  if (/^-{1,3}$/.test(s)) return true;
  if (/^#{1,6}\s/.test(s)) return true;
  if (/SNIPPET\s*\(HIZLI/i.test(s)) return true;
  if (/BODY\s*\(\s*ANA\s*MAKALE/i.test(s)) return true;
  if (/MEDIA\s*\)\s*VE\s*ALT[-\s]?TEXT/i.test(s)) return true;
  return false;
}

function resolveImageUrl(s: string | null | undefined): string | null {
  if (!s?.trim()) return null;
  const v = s.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const base = process.env.IMPORT_SITE_ORIGIN?.replace(/\/$/, "") ?? "";
  if (base && v.startsWith("/")) return `${base}${v}`;
  return v;
}

function getClient() {
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
  const local = resolve(process.cwd(), "thai-export.txt");
  if (existsSync(local)) return local;
  return win;
}

function buildMarkdownContent(body: string, expert?: string): string {
  const main = stripCites(body).trim();
  const chunks: string[] = [main];
  if (expert?.trim()) {
    chunks.push("\n\n## Arif GÜVENÇ tavsiyesi\n\n" + stripCites(expert).trim());
  }
  return chunks.join("").trim();
}

/**
 * Aynı Node sürecinde çağrılabilir (`import-thai-txt` delegasyonu).
 * @returns çıkış kodu 0 veya 1
 */
export async function runThaiExportImport(
  resolvedFilePath: string
): Promise<number> {
  loadEnvFiles();
  const filePath = resolvedFilePath;
  if (!existsSync(filePath)) {
    console.error("Dosya yok:", filePath);
    return 1;
  }

  const raw = readFileSync(filePath, "utf8");
  const yamlBundle = tryParseYamlFrontmatterAndNumberedSections(raw);

  let meta: Record<string, string>;
  let sec: Partial<Record<SectionKey, string>>;

  if (yamlBundle) {
    meta = yamlBundle.meta;
    sec = yamlBundle.sections;
  } else {
    sec = parseExportSections(raw);
    if (!sec.header) {
      console.error(
        "Export biçimi algılanmadı: YAML + numaralı bölümler (## 1. SNIPPET …) veya ## 1. HEADER (META DATA) gerekli."
      );
      return 1;
    }
    meta = parseMetaBlock(sec.header);
  }

  const slug = (meta.SLUG || "").trim();
  if (!slug) {
    console.error("SLUG eksik.");
    return 1;
  }

  const rawCat = meta.CATEGORY_ID || meta.CATEGORY || "";
  const category =
    (normalizeQuestionCategorySlug(rawCat) ?? rawCat.trim()) || "yasam";
  const region = (meta.REGION || "tayland").trim();
  const author = (meta.AUTHOR || "Arif GÜVENÇ").trim();
  const imageUrl = resolveImageUrl(meta.IMAGE_URL);
  let id: string | null = null;
  if (meta.ID && UUID_RE.test(meta.ID.trim())) id = meta.ID.trim();

  const lang = resolveImportArticleLang(
    meta,
    primaryLangFromHreflang(meta.HREFLANG)
  );
  const title = replacePerlamareWithArifGuvenc(
    (meta.TITLE || "").trim() || titleFromSlug(slug)
  );
  const excerpt = sec.snippet
    ? replacePerlamareWithArifGuvenc(stripCites(sec.snippet).trim())
    : meta.META_DESCRIPTION?.trim()
      ? replacePerlamareWithArifGuvenc(meta.META_DESCRIPTION.trim())
      : null;
  const bodyPart = sec.body?.trim();
  const normalizedBody = bodyPart
    ? fixLegacyCorporateLinks(
        normalizeExportedBodyMarkdown(stripCites(bodyPart))
      )
    : "";
  const expertPart = sec.expert?.trim();
  const normalizedExpert = expertPart
    ? fixLegacyCorporateLinks(
        normalizeExportedBodyMarkdown(stripCites(expertPart))
      )
    : undefined;
  const mediaRaw = sec.media?.trim();
  const mediaSeoText = mediaRaw
    ? replacePerlamareWithArifGuvenc(formatMediaSeoSection(stripCites(mediaRaw)))
    : null;
  const content = replacePerlamareWithArifGuvenc(
    buildMarkdownContent(normalizedBody, normalizedExpert)
  );

  const statusRaw = metaPublishAtRaw(meta);
  let publishIso: string | null = null;
  if (statusRaw) {
    publishIso = parseImportStatusPublishAt(statusRaw);
    if (!publishIso) {
      console.error(
        `STATUS / PUBLISH_AT anlaşılamadı: "${statusRaw}" (örn. 2026-04-02 09:00 veya ISO)`
      );
      return 1;
    }
  }

  const supabase = getClient();

  const { data: existingRows, error: fetchErr } = await supabase
    .from("questions")
    .select("id, category, title")
    .eq("slug", slug)
    .eq("lang", lang)
    .eq("region", region);

  if (fetchErr) {
    console.error("Mevcut kayıt sorgusu:", fetchErr.message);
    return 1;
  }

  const list = existingRows ?? [];
  const existing =
    list.find((r) => r.category === category) ?? list[0] ?? null;

  if (existing) {
    const patch: {
      content?: string;
      excerpt?: string | null;
      media_seo_text?: string | null;
      title?: string;
      created_at?: string;
      updated_at?: string;
    } = {};
    if (content) patch.content = content;
    if (excerpt !== null) patch.excerpt = excerpt;
    if (mediaSeoText !== null) patch.media_seo_text = mediaSeoText;
    if (titleNeedsRepair(existing.title)) patch.title = title;
    if (publishIso) {
      patch.created_at = publishIso;
      patch.updated_at = publishIso;
    }

    let mediaSeoWritten = Boolean(mediaSeoText);

    if (Object.keys(patch).length === 0) {
      console.error(
        "Bu slug için kayıt var ama dosyada güncellenecek alan yok (BODY, SNIPPET, uzman tavsiyesi veya MEDYA boş)."
      );
      return 1;
    }

    let { error: upErr } = await supabase
      .from("questions")
      .update(patch)
      .eq("id", existing.id);

    if (
      upErr &&
      isMissingMediaSeoColumnError(upErr.message) &&
      "media_seo_text" in patch
    ) {
      console.warn(
        "Uyarı: `media_seo_text` henüz veritabanında yok; içerik/özet yine güncelleniyor, SEO medya atlandı."
      );
      console.warn(MEDIA_SEO_PATCH_HINT);
      const { media_seo_text: _m, ...rest } = patch;
      if (Object.keys(rest).length === 0) {
        console.error("Güncelleme hatası:", upErr.message);
        return 1;
      }
      const second = await supabase
        .from("questions")
        .update(rest)
        .eq("id", existing.id);
      upErr = second.error;
      mediaSeoWritten = false;
    }

    if (upErr) {
      console.error("Güncelleme hatası:", upErr.message);
      return 1;
    }

    console.log(
      `Tamam (içerik/özet${mediaSeoWritten ? " + SEO medya" : ""}): ${slug} [id=${existing.id}, kategori=${existing.category}, lang=${lang}]`
    );
    logImportArticlePageUrl(lang, region, existing.category, slug);
    return 0;
  }

  if (!bodyPart) {
    console.error("Yeni kayıt için BODY (ana makale) bölümü gerekli.");
    return 1;
  }

  const row = {
    ...(id ? { id } : {}),
    lang,
    category,
    slug,
    title,
    content,
    excerpt,
    author,
    image_url: imageUrl,
    media_seo_text: mediaSeoText,
    region,
    related_slugs: [] as string[],
    ...(publishIso ? { created_at: publishIso, updated_at: publishIso } : {}),
  };

  let { error: upErr } = await supabase.from("questions").upsert(row, {
    onConflict: "lang,region,category,slug",
  });

  if (upErr && isMissingMediaSeoColumnError(upErr.message)) {
    console.warn(
      "Uyarı: `media_seo_text` henüz veritabanında yok; satır yine yazılıyor, SEO medya atlandı."
    );
    console.warn(MEDIA_SEO_PATCH_HINT);
    const { media_seo_text: _m, ...rowNoMedia } = row;
    const second = await supabase.from("questions").upsert(rowNoMedia, {
      onConflict: "lang,region,category,slug",
    });
    upErr = second.error;
  }

  if (upErr) {
    console.error("Upsert hatası:", upErr.message);
    return 1;
  }

  console.log(`Tamam (yeni/ tam satır): ${slug} (${category}, ${lang})`);
  logImportArticlePageUrl(lang, region, category, slug);
  return 0;
}

function isThisScriptCliEntry(): boolean {
  const a = process.argv[1];
  if (!a) return false;
  return a.replace(/\\/g, "/").includes("import-thai-export-txt");
}

async function cliMain(): Promise<void> {
  const filePath = resolve(process.argv[2] ?? defaultInputPath());
  const code = await runThaiExportImport(filePath);
  setTimeout(() => process.exit(code), 150);
}

if (isThisScriptCliEntry()) {
  cliMain().catch((e) => {
    console.error(e);
    setTimeout(() => process.exit(1), 150);
  });
}
