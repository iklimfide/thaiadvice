/**
 * İsteğe bağlı toplu migrasyon: Eski URL’leri tarayıp WebP’ye çevirir.
 * Günlük kullanım: Admin’de dosya veya görsel URL’si kaydettiğinizde WebP’ye çevirme
 * ve Storage’a yazma sunucu aksiyonlarında yapılır (ingest + image-webp).
 *
 * Veritabanındaki görsel URL’lerini indirir, WebP’ye çevirir, Supabase Storage
 * (blog-images) bucket’ına yükler ve ilgili satırı yeni public URL ile günceller.
 *
 * Kullanım:
 *   npx tsx scripts/convert-images-to-webp.ts [seçenekler]
 *
 * Seçenekler:
 *   --dry-run     İndir/dönüştür/yükle yapılmaz, sadece listelenir
 *   --force       URL zaten .webp bitse bile yeniden işler
 *   --tables=T    Virgülle: questions,places,regions,article_submissions (varsayılan: hepsi)
 *
 * Ortam (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SITE_URL   (isteğe bağlı; /images/... gibi göreli URL’ler için taban)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { slugSegmentForStorage } from "../lib/data/storage-slug";
import { bufferToWebp } from "../lib/server/image-webp";
import {
  ensureNodeFetchPrefersIpv4,
  normalizeSupabaseProjectUrl,
} from "../lib/supabase/net";

type TableKey = "questions" | "places" | "regions" | "article_submissions";

const ALL_TABLES: TableKey[] = [
  "questions",
  "places",
  "regions",
  "article_submissions",
];

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

function parseArgs() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes("--dry-run");
  const force = argv.includes("--force");
  let tables: TableKey[] = [...ALL_TABLES];
  const tablesArg = argv.find((a) => a.startsWith("--tables="));
  if (tablesArg) {
    const raw = tablesArg.slice("--tables=".length).toLowerCase();
    const want = new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
    tables = ALL_TABLES.filter((t) => want.has(t));
    if (tables.length === 0) {
      console.error("Geçersiz --tables=; izin verilen:", ALL_TABLES.join(","));
      process.exit(1);
    }
  }
  return { dryRun, force, tables };
}

function resolveFetchUrl(raw: string): string {
  const u = raw.trim();
  if (!u) throw new Error("Boş URL");
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  if (u.startsWith("/")) return `${base}${u}`;
  return u;
}

function isAlreadyWebp(url: string, force: boolean): boolean {
  if (force) return false;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path.endsWith(".webp");
  } catch {
    return url.toLowerCase().includes(".webp");
  }
}

async function fetchImageBuffer(url: string): Promise<Buffer> {
  const target = resolveFetchUrl(url);
  const res = await fetch(target, {
    redirect: "follow",
    headers: {
      "User-Agent": "ThaiAdvice-webp-migrate/1.0",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${target}`);
  }
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.startsWith("image/") && !ct.includes("octet-stream")) {
    throw new Error(`Beklenmeyen Content-Type: ${ct} (${target})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function getSupabase(): SupabaseClient {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli."
    );
  }
  ensureNodeFetchPrefersIpv4();
  const url = normalizeSupabaseProjectUrl(rawUrl);
  return createClient(url, key, { auth: { persistSession: false } });
}

async function uploadWebp(
  supabase: SupabaseClient,
  storagePath: string,
  body: Buffer,
  dryRun: boolean
): Promise<string> {
  if (dryRun) {
    console.log(`  [dry-run] yüklenecek: ${storagePath} (${body.length} bayt)`);
    return `https://dry-run.local/${storagePath}`;
  }
  const { error } = await supabase.storage
    .from("blog-images")
    .upload(storagePath, body, {
      contentType: "image/webp",
      upsert: true,
    });
  if (error) throw error;
  const { data } = supabase.storage.from("blog-images").getPublicUrl(storagePath);
  return data.publicUrl;
}

async function migrateQuestions(
  supabase: SupabaseClient,
  opts: { dryRun: boolean; force: boolean }
) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, slug, image_url")
    .not("image_url", "is", null);

  if (error) throw error;
  const rows = data ?? [];
  console.log(`\nquestions: ${rows.length} satır (image_url dolu)`);

  for (const row of rows) {
    const url = String(row.image_url ?? "").trim();
    if (!url) continue;
    if (isAlreadyWebp(url, opts.force)) {
      console.log(`  atlandı (webp): ${row.slug}`);
      continue;
    }
    console.log(`  işleniyor: ${row.slug} ← ${url.slice(0, 80)}…`);
    try {
      const buf = await fetchImageBuffer(url);
      const webp = await bufferToWebp(buf);
      const slugPart = slugSegmentForStorage(row.slug || row.id);
      const path = `webp-migrate/questions/${slugPart}/${slugPart}-${Date.now()}.webp`;
      const publicUrl = await uploadWebp(supabase, path, webp, opts.dryRun);
      if (!opts.dryRun) {
        const { error: upErr } = await supabase
          .from("questions")
          .update({ image_url: publicUrl })
          .eq("id", row.id);
        if (upErr) throw upErr;
      }
      console.log(`    → ${publicUrl}`);
    } catch (e) {
      console.error(`    HATA: ${e instanceof Error ? e.message : e}`);
    }
  }
}

async function migratePlaces(
  supabase: SupabaseClient,
  opts: { dryRun: boolean; force: boolean }
) {
  const { data, error } = await supabase
    .from("places")
    .select("id, slug, image")
    .not("image", "eq", "");

  if (error) throw error;
  const rows = (data ?? []).filter((r) => String(r.image ?? "").trim());
  console.log(`\nplaces: ${rows.length} satır (image dolu)`);

  for (const row of rows) {
    const url = String(row.image ?? "").trim();
    if (isAlreadyWebp(url, opts.force)) {
      console.log(`  atlandı (webp): ${row.slug}`);
      continue;
    }
    console.log(`  işleniyor: ${row.slug}`);
    try {
      const buf = await fetchImageBuffer(url);
      const webp = await bufferToWebp(buf);
      const path = `webp-migrate/places/${row.id}/${slugSegmentForStorage(row.slug)}-${Date.now()}.webp`;
      const publicUrl = await uploadWebp(supabase, path, webp, opts.dryRun);
      if (!opts.dryRun) {
        const { error: upErr } = await supabase
          .from("places")
          .update({ image: publicUrl })
          .eq("id", row.id);
        if (upErr) throw upErr;
      }
      console.log(`    → ${publicUrl}`);
    } catch (e) {
      console.error(`    HATA: ${e instanceof Error ? e.message : e}`);
    }
  }
}

async function migrateRegions(
  supabase: SupabaseClient,
  opts: { dryRun: boolean; force: boolean }
) {
  const { data, error } = await supabase
    .from("regions")
    .select("id, slug, image")
    .not("image", "eq", "");

  if (error) throw error;
  const rows = (data ?? []).filter((r) => String(r.image ?? "").trim());
  console.log(`\nregions: ${rows.length} satır (image dolu)`);

  for (const row of rows) {
    const url = String(row.image ?? "").trim();
    if (isAlreadyWebp(url, opts.force)) {
      console.log(`  atlandı (webp): ${row.slug}`);
      continue;
    }
    console.log(`  işleniyor: ${row.slug}`);
    try {
      const buf = await fetchImageBuffer(url);
      const webp = await bufferToWebp(buf);
      const path = `webp-migrate/regions/${row.id}/${slugSegmentForStorage(row.slug)}-${Date.now()}.webp`;
      const publicUrl = await uploadWebp(supabase, path, webp, opts.dryRun);
      if (!opts.dryRun) {
        const { error: upErr } = await supabase
          .from("regions")
          .update({ image: publicUrl })
          .eq("id", row.id);
        if (upErr) throw upErr;
      }
      console.log(`    → ${publicUrl}`);
    } catch (e) {
      console.error(`    HATA: ${e instanceof Error ? e.message : e}`);
    }
  }
}

async function migrateSubmissions(
  supabase: SupabaseClient,
  opts: { dryRun: boolean; force: boolean }
) {
  const { data, error } = await supabase
    .from("article_submissions")
    .select("id, title, image_url")
    .not("image_url", "is", null);

  if (error) throw error;
  const rows = (data ?? []).filter((r) => String(r.image_url ?? "").trim());
  console.log(`\narticle_submissions: ${rows.length} satır (image_url dolu)`);

  for (const row of rows) {
    const url = String(row.image_url ?? "").trim();
    if (isAlreadyWebp(url, opts.force)) {
      console.log(`  atlandı (webp): ${row.title?.slice(0, 40)}`);
      continue;
    }
    console.log(`  işleniyor: ${row.title?.slice(0, 60)}`);
    try {
      const buf = await fetchImageBuffer(url);
      const webp = await bufferToWebp(buf);
      const path = `webp-migrate/submissions/${row.id}/${slugSegmentForStorage(row.title ?? "oneri")}-${Date.now()}.webp`;
      const publicUrl = await uploadWebp(supabase, path, webp, opts.dryRun);
      if (!opts.dryRun) {
        const { error: upErr } = await supabase
          .from("article_submissions")
          .update({ image_url: publicUrl })
          .eq("id", row.id);
        if (upErr) throw upErr;
      }
      console.log(`    → ${publicUrl}`);
    } catch (e) {
      console.error(`    HATA: ${e instanceof Error ? e.message : e}`);
    }
  }
}

async function main() {
  loadEnvFiles();
  const opts = parseArgs();
  console.log(
    `WebP migrasyonu dryRun=${opts.dryRun} force=${opts.force} tables=${opts.tables.join(",")}`
  );

  const supabase = getSupabase();

  for (const t of opts.tables) {
    if (t === "questions") await migrateQuestions(supabase, opts);
    if (t === "places") await migratePlaces(supabase, opts);
    if (t === "regions") await migrateRegions(supabase, opts);
    if (t === "article_submissions") await migrateSubmissions(supabase, opts);
  }

  console.log("\nBitti.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
