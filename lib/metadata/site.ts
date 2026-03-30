import type { Metadata } from "next";
import {
  DEFAULT_SITE_LANG,
  alternateOpenGraphLocales,
  openGraphLocaleForLang,
} from "@/lib/seo/site-languages";

const defaultTitle = "ThaiAdvice.com — Tayland rehberi";

/** Vercel Production’da NEXT_PUBLIC_SITE_URL yok / localhost ise sitemap ve metadata için */
const PRODUCTION_CANONICAL_ORIGIN = "https://www.thaiadvice.com";

/**
 * Canonical site origin for metadata and absolute links.
 * 1) NEXT_PUBLIC_SITE_URL — Vercel’de özel alan (Production’da localhost yazılı env yok sayılır)
 * 2) Vercel Production — sabit üretim alanı (sitemap’in deployment alt alanında kalmaması için)
 * 3) VERCEL_URL — önizleme veya diğer Vercel ortamları
 * 4) Yerel: http://localhost:3000
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

function isLocalhostOrigin(origin: string): boolean {
  try {
    const h = new URL(origin).hostname.toLowerCase();
    return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
  } catch {
    return false;
  }
}

export function getPublicSiteUrl(): string {
  const onVercel = process.env.VERCEL === "1";
  const prodOnVercel =
    onVercel && process.env.VERCEL_ENV === "production";

  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    const ok = asValidOrigin(
      fromEnv.includes("://") ? fromEnv : `http://${fromEnv}`
    );
    if (ok && !(onVercel && isLocalhostOrigin(ok))) return ok;
  }

  if (prodOnVercel) {
    return PRODUCTION_CANONICAL_ORIGIN;
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const ok = asValidOrigin(
      vercel.startsWith("http") ? vercel : `https://${vercel}`
    );
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
  /** og:image alt; yoksa başlık kullanılır */
  imageAlt?: string | null | undefined;
  /** Kanonik pathname, / ile başlar */
  path: string;
  /** Sayfa dili (og:locale); hreflang dışı */
  locale?: string;
  /**
   * hreflang: dil kodu → pathname (örn. { tr: '/tr/foo', en: '/en/foo' }).
   * Yalnızca gerçekten var olan çevirileri verin; uydurma URL eklemeyin.
   */
  languagePaths?: Partial<Record<string, string>>;
}): Metadata {
  const title = input.title?.trim() || defaultTitle;
  const description =
    input.description?.trim() ||
    "Tayland bölgeleri, alt bölgeler ve mekanlar için güncel rehber.";
  const imageAlt = input.imageAlt?.trim() || title;
  const images = input.image
    ? [{ url: absoluteUrl(input.image), alt: imageAlt }]
    : undefined;

  const pathname =
    input.path.startsWith("/") ? input.path : `/${input.path}`;
  const canonical = absoluteUrl(pathname);

  const loc = (input.locale ?? "tr").trim().toLowerCase();
  const ogLocale = openGraphLocaleForLang(loc);

  let alternates: Metadata["alternates"];
  const rawLangPaths = input.languagePaths;
  if (rawLangPaths && Object.keys(rawLangPaths).length > 0) {
    const languages: Record<string, string> = {};
    for (const [code, p] of Object.entries(rawLangPaths)) {
      if (!p?.trim()) continue;
      const rel = p.startsWith("/") ? p : `/${p}`;
      languages[code.trim()] = absoluteUrl(rel);
    }
    if (Object.keys(languages).length > 0) {
      const xDef =
        languages[DEFAULT_SITE_LANG] ??
        languages[loc] ??
        canonical;
      languages["x-default"] = xDef;
      alternates = { canonical, languages };
    } else {
      alternates = { canonical };
    }
  } else {
    alternates = { canonical };
  }

  const definedLangEntries =
    rawLangPaths == null
      ? []
      : Object.entries(rawLangPaths).filter(([, p]) => Boolean(p?.trim()));
  const ogAlternateLocales =
    definedLangEntries.length > 1 ? alternateOpenGraphLocales(loc) : undefined;

  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      url: canonical,
      locale: ogLocale,
      ...(ogAlternateLocales?.length
        ? { alternateLocale: ogAlternateLocales }
        : {}),
      images,
      type: "website",
      siteName: "ThaiAdvice.com",
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images: images?.map((i) => i.url),
    },
  };
}
