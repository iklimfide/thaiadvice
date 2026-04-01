import type { SiteLang } from "@/lib/seo/site-languages";

/**
 * Site içi adreslerde dil segmentini değiştirir (örn. /tr/... → /en/...).
 * - Göreli markdown: `](/tr/...`
 * - Tam URL: yapılandırılmış `siteOrigin` + ThaiAdvice kanonik host varyantları (www / www’sız uyumsuzluk)
 * Harici sitelerdeki `/tr/` yollarına dokunulmaz (yalnızca bilinen site host’ları + göreli site yolu).
 */
export function rewriteMarkdownLocalePaths(
  text: string,
  siteOrigin: string,
  from: SiteLang,
  to: SiteLang
): string {
  if (from === to || !text) return text;
  const origin = siteOrigin.replace(/\/$/, "");
  let s = text;

  if (origin) {
    const esc = origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(`${esc}\\/${from}\\/`, "g"), `${origin}/${to}/`);
  }

  /* ThaiAdvice: çeviride kalan /tr/ mutlak linkler (env www iken içerik thaiadvice.com vb.) */
  s = s.replace(
    new RegExp(
      `(https?:\\/\\/(?:www\\.)?thaiadvice\\.com)\\/${from}\\/`,
      "gi"
    ),
    `$1/${to}/`
  );

  /* Göreli site yolu (model / editör her ortamda aynı) */
  s = s.replace(new RegExp(`\\]\\(\\s*\\/${from}\\/`, "g"), `](/${to}/`);
  s = s.replace(new RegExp(`href=(["'])\\/${from}\\/`, "gi"), `href=$1/${to}/`);

  /* Yaygın önizleme: *.vercel.app/tr/… */
  s = s.replace(
    new RegExp(`(https:\\/\\/[^\\s)\\]]+\\.vercel\\.app)\\/${from}\\/`, "gi"),
    `$1/${to}/`
  );

  return s;
}
