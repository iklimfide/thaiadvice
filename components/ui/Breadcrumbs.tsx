import Link from "next/link";
import { absoluteUrl } from "@/lib/metadata/site";

export type Crumb = { label: string; href?: string };

type Props = {
  items: Crumb[];
  /** Geçerli sayfanın pathname’i; JSON-LD ve son kırıntı URL’si için */
  pagePath: string;
};

function breadcrumbJsonLd(items: Crumb[], pagePath: string) {
  const normalizedPath = pagePath.startsWith("/") ? pagePath : `/${pagePath}`;
  const list = items.map((c, i) => {
    const path = c.href ?? normalizedPath;
    const url = absoluteUrl(path.startsWith("/") ? path : `/${path}`);
    return {
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      item: url,
    };
  });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: list,
  };
}

/**
 * Tek satır (flex-nowrap); taşan parçalar … ile kısalır, tam metin DOM’da kalır.
 * Schema.org BreadcrumbList JSON-LD ile tam yol arama motorlarına açık.
 */
export function Breadcrumbs({ items, pagePath }: Props) {
  const n = items.length;
  const pathLabel = items.map((c) => c.label).join(" / ");
  const jsonLd = breadcrumbJsonLd(items, pagePath);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <nav
        aria-label={`Breadcrumb: ${pathLabel}`}
        className="mb-8 w-full min-w-0 max-w-full sm:mb-10"
      >
        <ol className="flex min-w-0 max-w-full list-none flex-nowrap items-center gap-x-0 text-[11px] leading-tight text-zinc-600 sm:text-sm sm:leading-snug">
          {items.map((c, i) => {
            const isFirst = i === 0;
            const isLast = i === n - 1;
            const liClass = isFirst
              ? "shrink-0"
              : isLast
                ? "min-w-0 flex-1 basis-0"
                : "min-w-0 max-w-[28%] shrink sm:max-w-[9rem]";

            const linkClass = isFirst
              ? "shrink-0 transition hover:text-brand hover:underline"
              : "min-w-0 flex-1 truncate transition hover:text-brand hover:underline";
            const currentClass = isFirst
              ? "shrink-0 font-medium text-zinc-900"
              : "min-w-0 flex-1 truncate font-medium text-zinc-900";

            const body = c.href ? (
              <Link href={c.href} title={c.label} className={linkClass}>
                {c.label}
              </Link>
            ) : (
              <span title={c.label} className={currentClass}>
                {c.label}
              </span>
            );

            return (
              <li key={`${c.label}-${i}`} className={`flex min-w-0 items-center ${liClass}`}>
                {i > 0 ? (
                  <span className="shrink-0 px-1 text-zinc-400 sm:px-1.5" aria-hidden>
                    /
                  </span>
                ) : null}
                {body}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
