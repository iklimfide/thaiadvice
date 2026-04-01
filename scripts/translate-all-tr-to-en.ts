/**
 * Tüm lang=tr makaleleri OpenAI ile İngilizceye çevirip lang=en satırı upsert eder.
 *
 *   npx tsx scripts/translate-all-tr-to-en.ts
 *   npx tsx scripts/translate-all-tr-to-en.ts --only-missing
 *   npx tsx scripts/translate-all-tr-to-en.ts --limit 3 --dry-run
 *   npx tsx scripts/translate-all-tr-to-en.ts --delay-ms 1200
 *
 * Ortam (.env.local): NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
 * İç linkler: NEXT_PUBLIC_SITE_URL (veya Vercel) — rewriteMarkdownLocalePaths ile /en/ öneki
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { mapQuestionRow } from "../lib/data/map-rows";
import { getPublicSiteUrl } from "../lib/metadata/site";
import { upsertEnglishFromTurkishQuestion } from "../lib/server/upsert-english-from-turkish-question";
import { normalizeSupabaseProjectUrl } from "../lib/supabase/net";
import type { QuestionRow } from "../lib/types/database";

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

function enKey(q: QuestionRow): string {
  return `${q.region}\t${q.category}\t${q.slug}`;
}

function parseArgs() {
  const argv = process.argv.slice(2);
  let onlyMissing = false;
  let dryRun = false;
  let limit: number | null = null;
  let delayMs = 800;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--only-missing") onlyMissing = true;
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--limit" && argv[i + 1]) {
      limit = Math.max(1, parseInt(argv[++i], 10) || 1);
    } else if (a.startsWith("--limit=")) {
      limit = Math.max(1, parseInt(a.split("=")[1], 10) || 1);
    } else if (a === "--delay-ms" && argv[i + 1]) {
      delayMs = Math.max(0, parseInt(argv[++i], 10) || 0);
    } else if (a.startsWith("--delay-ms=")) {
      delayMs = Math.max(0, parseInt(a.split("=")[1], 10) || 0);
    }
  }
  return { onlyMissing, dryRun, limit, delayMs };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchAllTurkishQuestions(
  db: ReturnType<typeof createClient>
): Promise<QuestionRow[]> {
  const pageSize = 500;
  const out: QuestionRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from("questions")
      .select("*")
      .eq("lang", "tr")
      .order("created_at", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    const rows = data ?? [];
    for (const raw of rows) {
      out.push(mapQuestionRow(raw));
    }
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return out;
}

async function fetchExistingEnKeys(
  db: ReturnType<typeof createClient>
): Promise<Set<string>> {
  const pageSize = 500;
  const keys = new Set<string>();
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from("questions")
      .select("region,category,slug,lang")
      .eq("lang", "en")
      .range(from, from + pageSize - 1);

    if (error) throw new Error(error.message);
    const rows = data ?? [];
    for (const raw of rows) {
      const r = raw as { region?: string; category?: string; slug?: string };
      if (r.region && r.category && r.slug) {
        keys.add(`${r.region}\t${r.category}\t${r.slug}`);
      }
    }
    if (rows.length < pageSize) break;
    from += pageSize;
  }
  return keys;
}

async function main() {
  loadEnvFiles();
  const { onlyMissing, dryRun, limit, delayMs } = parseArgs();

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!rawUrl || !service) {
    console.error("NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY?.trim()) {
    console.error("OPENAI_API_KEY gerekli.");
    process.exit(1);
  }

  const db = createClient(normalizeSupabaseProjectUrl(rawUrl), service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const siteOrigin = getPublicSiteUrl();
  console.log(
    `Site origin (iç link rewrite): ${siteOrigin || "(boş)"}\n` +
      `only-missing=${onlyMissing} dry-run=${dryRun} limit=${limit ?? "∞"} delay-ms=${delayMs}\n`
  );

  const trList = await fetchAllTurkishQuestions(db);
  const enKeys = onlyMissing ? await fetchExistingEnKeys(db) : new Set<string>();

  let todo = trList;
  if (onlyMissing) {
    todo = trList.filter((q) => !enKeys.has(enKey(q)));
  }
  if (limit != null) {
    todo = todo.slice(0, limit);
  }

  console.log(`TR makale: ${trList.length}, işlenecek: ${todo.length}\n`);

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < todo.length; i++) {
    const q = todo[i];
    const label = `${q.slug} (${q.region}/${q.category})`;
    if (dryRun) {
      console.log(`[${i + 1}/${todo.length}] dry-run: ${label}`);
      ok++;
      continue;
    }

    const r = await upsertEnglishFromTurkishQuestion(db, q, siteOrigin);
    if (r.ok) {
      console.log(`[${i + 1}/${todo.length}] OK: ${label} → ${r.enPath ?? ""}`);
      ok++;
    } else {
      console.error(`[${i + 1}/${todo.length}] HATA: ${label} — ${r.message}`);
      fail++;
    }

    if (i < todo.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  console.log(`\nBitti. Başarılı: ${ok}, hatalı: ${fail}`);
  setTimeout(() => process.exit(fail > 0 ? 1 : 0), 100);
}

main().catch((e) => {
  console.error(e);
  setTimeout(() => process.exit(1), 100);
});
