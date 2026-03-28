/**
 * Perlamare export biçimi (## 1. HEADER …, [cite: N], --- ayraçları) → Supabase `questions`
 *
 * Kullanım:
 *   npx tsx scripts/import-thai-export-txt.ts [dosya-yolu]
 *
 * Varsayılan: C:\Users\iklim\Downloads\thai\thai.txt (yoksa ./thai-export.txt)
 *
 * Ortam: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (önerilir)
 *
 * Aynı slug+lang+region için satır zaten varsa: yalnızca `content`, `excerpt` ve
 * (dosyada 5. bölüm varsa) `media_seo_text` güncellenir. Yoksa tam upsert.
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
  const u = line.toUpperCase();
  if (u.includes("HEADER") && u.includes("META")) return "header";
  if (u.includes("SNIPPET") || u.includes("HIZLI CEVAP")) return "snippet";
  if (u.includes("BODY") || u.includes("ANA MAKALE")) return "body";
  if (u.includes("PERLAMARE") || u.includes("EXPERT INSIGHT")) return "expert";
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
    chunks.push("\n\n## Perlamare görüşü\n\n" + stripCites(expert).trim());
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
  const sec = parseExportSections(raw);

  if (!sec.header) {
    console.error(
      "Export biçimi algılanmadı: '## 1. HEADER (META DATA)' bölümü yok."
    );
    return 1;
  }

  const meta = parseMetaBlock(sec.header);
  const slug = (meta.SLUG || "").trim();
  if (!slug) {
    console.error("SLUG eksik.");
    return 1;
  }

  const rawCat = meta.CATEGORY_ID || meta.CATEGORY || "";
  const category =
    (normalizeQuestionCategorySlug(rawCat) ?? rawCat.trim()) || "yasam";
  const region = (meta.REGION || "tayland").trim();
  const author = (meta.AUTHOR || "Perlamare").trim();
  const imageUrl = resolveImageUrl(meta.IMAGE_URL);
  let id: string | null = null;
  if (meta.ID && UUID_RE.test(meta.ID.trim())) id = meta.ID.trim();

  const lang = primaryLangFromHreflang(meta.HREFLANG);
  const title = (meta.TITLE || "").trim() || titleFromSlug(slug);
  const excerpt = sec.snippet ? stripCites(sec.snippet).trim() : null;
  const bodyPart = sec.body?.trim();
  const mediaSeoText = sec.media?.trim()
    ? stripCites(sec.media).trim()
    : null;
  const content = buildMarkdownContent(bodyPart ?? "", sec.expert);

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
    } = {};
    if (content) patch.content = content;
    if (excerpt !== null) patch.excerpt = excerpt;
    if (mediaSeoText !== null) patch.media_seo_text = mediaSeoText;
    if (titleNeedsRepair(existing.title)) patch.title = title;

    let mediaSeoWritten = Boolean(mediaSeoText);

    if (Object.keys(patch).length === 0) {
      console.error(
        "Bu slug için kayıt var ama dosyada güncellenecek alan yok (BODY, SNIPPET, Perlamare veya MEDYA boş)."
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
      `Tamam (içerik/özet${mediaSeoWritten ? " + SEO medya" : ""}): ${slug} [id=${existing.id}, kategori=${existing.category}]`
    );
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
