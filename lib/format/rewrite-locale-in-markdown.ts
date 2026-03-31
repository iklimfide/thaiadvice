import type { SiteLang } from "@/lib/seo/site-languages";

/**
 * Site içi adreslerde dil segmentini değiştirir (örn. /tr/... → /en/...).
 * Mutlak URL’ler yalnızca `siteOrigin` ile başlıyorsa dokunulur; harici sitelerdeki /tr/ yolu değişmez.
 */
export function rewriteMarkdownLocalePaths(
  text: string,
  siteOrigin: string,
  from: SiteLang,
  to: SiteLang
): string {
  if (from === to || !text) return text;
  const origin = siteOrigin.replace(/\/$/, "");
  if (!origin) return text;
  const esc = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let s = text;
  s = s.replace(new RegExp(`${esc}\\/${from}\\/`, "g"), `${origin}/${to}/`);
  s = s.replace(new RegExp(`\\]\\(\\s*\\/${from}\\/`, "g"), `](/${to}/`);
  s = s.replace(new RegExp(`href=(["'])\\/${from}\\/`, "gi"), `href=$1/${to}/`);
  return s;
}
