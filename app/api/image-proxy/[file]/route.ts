import { NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase/service";

export const runtime = "nodejs";

/** Kök yolu çakıştırmamak için en az 10 haneli zaman damgası; `/` yok */
const FILENAME_RE = /^[^/\\?#]+-[0-9]{10,}\.webp$/i;

/**
 * Kök URL `/{slug}-{timestamp}.webp` → DB’den image_url bulunur, Supabase’ten stream.
 * (Veritabanında tam Supabase adresi saklanmaya devam eder.)
 */
export async function GET(
  _request: Request,
  context: { params: { file: string } }
) {
  const { file: raw } = context.params;
  const decoded = decodeURIComponent(raw ?? "");
  if (!FILENAME_RE.test(decoded)) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  let db;
  try {
    db = getSupabaseServiceRole();
  } catch {
    return new NextResponse("Server misconfigured", { status: 500 });
  }

  const suffix = `/${decoded}`;
  const { data: rows, error } = await db
    .from("questions")
    .select("image_url")
    .not("image_url", "is", null)
    .ilike("image_url", `%${suffix}`)
    .limit(8);

  if (error) {
    console.error("[image-proxy] query:", error.message);
    return new NextResponse("Lookup failed", { status: 500 });
  }

  const candidates = (rows ?? [])
    .map((r) => (r as { image_url?: string }).image_url?.trim())
    .filter((u): u is string => Boolean(u));

  const imageUrl = candidates.find(
    (u) => u.endsWith(suffix) || u.split("?")[0].endsWith(suffix)
  );

  if (!imageUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  const upstream = await fetch(imageUrl, {
    next: { revalidate: 86400 },
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse("Upstream error", { status: 502 });
  }

  const headers = new Headers();
  const ct = upstream.headers.get("Content-Type");
  headers.set("Content-Type", ct && ct.startsWith("image/") ? ct : "image/webp");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new NextResponse(upstream.body, { status: 200, headers });
}
