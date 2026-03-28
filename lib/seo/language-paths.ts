import { SITE_LANGS } from "@/lib/seo/site-languages";

/**
 * Aynı kaynak, farklı dil önekleri: `tayland/kultur/x` → `/tr/...`, `/en/...`
 * @param segments - `lang` olmadan path parçaları (örn. `tayland` veya `tayland/phuket`)
 */
export function localizedPathAlternates(
  ...segments: string[]
): Record<string, string> {
  const tail = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return Object.fromEntries(
    SITE_LANGS.map((l) => [l, tail ? `/${l}/${tail}` : `/${l}`])
  );
}
