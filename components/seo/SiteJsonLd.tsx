import { getPublicSiteUrl } from "@/lib/metadata/site";
import { SITE_LANGS } from "@/lib/seo/site-languages";

type Props = { lang: string };

/**
 * Ana sayfa: WebSite + SearchAction (iç arama `?q=`) + Organization.
 */
export function SiteJsonLd({ lang }: Props) {
  const base = getPublicSiteUrl().replace(/\/$/, "");
  const safeLang = lang === "en" ? "en" : "tr";
  const searchTemplate = `${base}/${safeLang}?q={search_term_string}`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": `${base}/#website`,
      name: "ThaiAdvice.com",
      url: base,
      inLanguage: [...SITE_LANGS],
      publisher: { "@id": `${base}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: searchTemplate,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": `${base}/#organization`,
      name: "ThaiAdvice.com",
      url: base,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
