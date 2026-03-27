import dns from "node:dns";

let ipv4FirstApplied = false;

/**
 * Windows / bazı ağlarda IPv6 yolu çalışmaz; Node önce IPv6 denerse
 * Supabase istekleri "TypeError: fetch failed" ile düşer.
 */
export function ensureNodeFetchPrefersIpv4(): void {
  if (ipv4FirstApplied) return;
  ipv4FirstApplied = true;
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
}

/** Proje URL’sini Supabase istemcisi için sadeleştirir (https, sondaki / yok). */
export function normalizeSupabaseProjectUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  const withProto = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  let u: URL;
  try {
    u = new URL(withProto);
  } catch {
    throw new Error(`Geçersiz NEXT_PUBLIC_SUPABASE_URL: ${raw}`);
  }
  if (u.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL https olmalıdır");
  }
  return u.origin;
}
