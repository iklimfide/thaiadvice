import { absoluteUrl, getPublicSiteUrl } from "@/lib/metadata/site";
import type { PlaceRow, RegionRow, SubRegionRow } from "@/lib/types/database";

function plainTextFromMarkdownish(s: string, max: number): string {
  const t = s
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Mekân detay sayfası — TouristAttraction + isteğe bağlı açıklama.
 */
export function placeDetailJsonLd(input: {
  place: PlaceRow;
  region: RegionRow;
  sub: SubRegionRow;
  pagePath: string;
  lang: string;
}): Record<string, unknown> {
  const path = input.pagePath.startsWith("/")
    ? input.pagePath
    : `/${input.pagePath}`;
  const url = absoluteUrl(path);
  const site = getPublicSiteUrl().replace(/\/$/, "");
  const intro = input.place.ai_intro?.trim();
  const desc = intro ? plainTextFromMarkdownish(intro, 320) : undefined;
  const img = input.place.image?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: input.place.name || input.place.slug,
    description: desc,
    url,
    inLanguage: input.lang,
    ...(img
      ? {
          image: {
            "@type": "ImageObject",
            url: absoluteUrl(img),
          },
        }
      : {}),
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: input.sub.name || input.sub.slug,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: input.region.name || input.region.slug,
      },
    },
    provider: {
      "@type": "Organization",
      name: "ThaiAdvice.com",
      url: site,
    },
  };
}
