import type { Metadata } from "next";

const defaultTitle = "ThaiAdvice.com — Tayland rehberi";

/**
 * Canonical site origin for metadata and absolute links.
 * 1) NEXT_PUBLIC_SITE_URL — Vercel’de özel alan veya sabit üretim URL’si için Environment Variable
 * 2) VERCEL_URL — Vercel’in otomatik verdiği deployment adresi (https eklenir)
 * 3) Yerel geliştirme
 */
function asValidOrigin(raw: string): string | null {
  const s = raw.trim().replace(/\/$/, "");
  if (!s) return null;
  try {
    const withProto = s.includes("://") ? s : `https://${s}`;
    return new URL(withProto).origin;
  } catch {
    return null;
  }
}

export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const ok = asValidOrigin(
      fromEnv.includes("://") ? fromEnv : `http://${fromEnv}`
    );
    if (ok) return ok;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const ok = asValidOrigin(vercel.startsWith("http") ? vercel : `https://${vercel}`);
    if (ok) return ok;
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = getPublicSiteUrl();
  if (path.startsWith("http")) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata(input: {
  title: string | null | undefined;
  description: string | null | undefined;
  image: string | null | undefined;
  path: string;
}): Metadata {
  const title = input.title?.trim() || defaultTitle;
  const description =
    input.description?.trim() ||
    "Tayland bölgeleri, alt bölgeler ve mekanlar için güncel rehber.";
  const images = input.image
    ? [{ url: absoluteUrl(input.image), alt: title }]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: absoluteUrl(input.path),
      images,
      type: "website",
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}
