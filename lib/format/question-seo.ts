import type { QuestionRow } from "@/lib/types/database";
import { absoluteUrl, getPublicSiteUrl } from "@/lib/metadata/site";
import { sitePublicImagePathFromQuestionStorageUrl } from "@/lib/format/site-image-url";

/**
 * Export’taki `- TR:` / `TR:` satırından og:image alt (sayfa diline göre).
 */
export function ogImageAltFromMediaSeo(
  lang: string,
  mediaSeo: string | null | undefined
): string | undefined {
  const raw = mediaSeo?.trim();
  if (!raw) return undefined;
  const code = lang.trim().toUpperCase();
  const re = new RegExp(
    `^[-*\\s]*${code}\\s*:\\s*(.+)$`,
    "im"
  );
  const m = raw.match(re);
  if (m) {
    const t = m[1].trim();
    return t.length > 420 ? `${t.slice(0, 417)}…` : t;
  }
  const firstLine = raw
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstLine) return undefined;
  const stripped = firstLine
    .replace(/^[-*]\s*[^:]+:\s*/i, "")
    .trim();
  const pick = stripped || firstLine.replace(/^[-*]\s*/, "").trim();
  if (!pick) return undefined;
  return pick.length > 420 ? `${pick.slice(0, 417)}…` : pick;
}

/**
 * Makale sayfası JSON-LD (Article); media_seo_text varsa ImageObject.caption veya hasPart.
 */
function absoluteQuestionImageUrl(raw: string): string {
  const imgShort = sitePublicImagePathFromQuestionStorageUrl(raw);
  return imgShort ? absoluteUrl(imgShort) : raw;
}

export function questionArticleJsonLd(
  question: QuestionRow,
  pagePath: string
): Record<string, unknown> {
  const path = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
  const url = absoluteUrl(path);
  const site = getPublicSiteUrl().replace(/\/$/, "");
  const media = question.media_seo_text?.trim();
  const desc =
    question.excerpt?.trim() ||
    undefined;

  const imageParts: Record<string, unknown>[] = [];
  const imgRaw = question.image_url?.trim();
  if (imgRaw) {
    imageParts.push({
      "@type": "ImageObject",
      url: absoluteQuestionImageUrl(imgRaw),
      ...(media ? { caption: media } : {}),
    });
  }
  for (const ex of question.extra_images ?? []) {
    const u = ex.url?.trim();
    if (!u) continue;
    const cap = ex.alt?.trim();
    imageParts.push({
      "@type": "ImageObject",
      url: absoluteQuestionImageUrl(u),
      ...(cap ? { caption: cap } : {}),
    });
  }

  let imageField: unknown;
  if (imageParts.length === 1) {
    imageField = imageParts[0];
  } else if (imageParts.length > 1) {
    imageField = imageParts;
  }

  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: question.title,
    description: desc,
    datePublished: question.created_at,
    dateModified: question.updated_at ?? question.created_at,
    author: {
      "@type": "Person",
      name: question.author?.trim() || "Arif GÜVENÇ",
    },
    publisher: {
      "@type": "Organization",
      name: "ThaiAdvice.com",
      url: site,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    url,
    inLanguage: question.lang,
  };

  if (imageField) {
    base.image = imageField;
  } else if (media) {
    base.hasPart = {
      "@type": "CreativeWork",
      name: "Image and alt text (editorial)",
      text: media,
    };
  }

  return base;
}
