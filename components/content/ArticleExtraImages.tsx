"use client";

import { ExpandableImage } from "@/components/ui/ExpandableImage";
import type { ArticleExtraImage } from "@/lib/types/database";

type Props = {
  images: ArticleExtraImage[];
  lang: string;
  className?: string;
};

export function ArticleExtraImages({ images, lang, className }: Props) {
  if (!images.length) return null;
  const title = lang === "tr" ? "Görseller" : "Images";

  return (
    <section
      className={className}
      aria-label={title}
    >
      <h2 className="mb-4 border-l-4 border-category bg-category/[0.08] py-2 pl-3 pr-2 font-serif text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
        {title}
      </h2>
      <ul className="grid list-none gap-6 sm:grid-cols-2">
        {images.map((img, i) => (
          <li key={`${img.url}-${i}`} className="min-w-0">
            <ExpandableImage
              src={img.url}
              alt={img.alt?.trim() ?? ""}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.alt?.trim() ?? ""}
                className="mx-auto max-h-[min(70vh,560px)] w-full rounded-lg border border-zinc-200 object-contain transition group-hover:opacity-95"
                loading="lazy"
                decoding="async"
              />
            </ExpandableImage>
            {img.alt?.trim() ? (
              <p className="mt-2 text-center text-sm leading-snug text-zinc-600">
                {img.alt.trim()}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
