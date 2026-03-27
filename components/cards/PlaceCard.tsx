import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import type { PlaceRow } from "@/lib/types/database";

type Props = {
  lang: string;
  regionSlug: string;
  subRegionSlug: string;
  place: PlaceRow;
};

export function PlaceCard({
  lang,
  regionSlug,
  subRegionSlug,
  place,
}: Props) {
  const href = `/${lang}/${regionSlug}/${subRegionSlug}/${place.slug}`;
  const label = place.name || place.slug;
  const hasImage = Boolean(place.image?.trim());

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-brand/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] bg-zinc-200">
        {hasImage ? (
          <SafeImage
            fill
            src={place.image}
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 33vw"
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand/10 to-category/10 text-center text-sm font-medium text-brand/50">
                {label}
              </div>
            }
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/10 to-category/10 text-center text-sm font-medium text-brand/50">
            {label}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-serif text-lg font-bold text-zinc-900 group-hover:text-brand">
            {label}
          </h2>
          <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-brand-dark">
            {place.price_level}
          </span>
          {place.rating > 0 ? (
            <span className="text-xs font-medium text-category">★ {place.rating}</span>
          ) : null}
        </div>
        {place.ai_intro?.trim() ? (
          <p className="line-clamp-2 text-sm text-zinc-600">{place.ai_intro}</p>
        ) : null}
      </div>
    </Link>
  );
}
