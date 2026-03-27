import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { slugSegmentForStorage } from "@/lib/data/storage-slug";
import { bufferToWebp } from "@/lib/server/image-webp";
import { ensureNodeFetchPrefersIpv4 } from "@/lib/supabase/net";

const MAX_FETCH_BYTES = 15 * 1024 * 1024;

export { slugSegmentForStorage } from "@/lib/data/storage-slug";

export function resolveRemoteImageUrl(raw: string): string {
  const u = raw.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  if (u.startsWith("/")) return `${base}${u}`;
  return u;
}

function assertFetchableHttpUrl(url: URL): void {
  if (url.protocol === "https:") return;
  if (
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  ) {
    return;
  }
  throw new Error(
    "Yalnız https:// veya yerel http://localhost / 127.0.0.1 adresleri kabul edilir."
  );
}

export async function fetchRemoteImageBuffer(urlString: string): Promise<Buffer> {
  ensureNodeFetchPrefersIpv4();
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Geçersiz görsel adresi.");
  }
  assertFetchableHttpUrl(url);

  const res = await fetch(urlString, {
    redirect: "follow",
    headers: { "User-Agent": "ThaiAdvice-image-ingest/1.0" },
  });
  if (!res.ok) {
    throw new Error(`Görsel indirilemedi (HTTP ${res.status}).`);
  }
  const len = res.headers.get("content-length");
  if (len && Number(len) > MAX_FETCH_BYTES) {
    throw new Error("Görsel çok büyük (15 MB sınırı).");
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_FETCH_BYTES) {
    throw new Error("Görsel çok büyük (15 MB sınırı).");
  }
  const ct = (res.headers.get("content-type") ?? "").toLowerCase();
  if (!ct.startsWith("image/")) {
    throw new Error("URL bir görsel döndürmüyor (Content-Type).");
  }
  return buf;
}

/** Uzak veya site köküne göre çözülen URL → WebP → blog-images yolu. */
export async function ingestRemoteImageAsWebpToStorage(
  supabase: SupabaseClient,
  sourceUrl: string,
  storageObjectPath: string
): Promise<{ publicUrl: string } | { error: string }> {
  const resolved = resolveRemoteImageUrl(sourceUrl);
  if (!resolved) {
    return { error: "Boş adres." };
  }

  let raw: Buffer;
  try {
    raw = await fetchRemoteImageBuffer(resolved);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Görsel indirilemedi.",
    };
  }

  let webp: Buffer;
  try {
    webp = await bufferToWebp(raw);
  } catch {
    return { error: "WebP dönüşümü başarısız." };
  }

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(storageObjectPath, webp, {
      contentType: "image/webp",
      upsert: true,
    });
  if (error) {
    return { error: error.message };
  }
  const { data } = supabase.storage
    .from("blog-images")
    .getPublicUrl(storageObjectPath);
  return { publicUrl: data.publicUrl };
}
