import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import type { RegionRow } from "@/lib/types/database";

type Props = { lang: string; region: RegionRow };

export function RegionCard({ lang, region }: Props) {
  const href = `/${lang}/${region.slug}`;
  const label = region.name || region.slug;
  const hasImage = Boolean(region.image?.trim());

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-brand/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] bg-zinc-200">
        {hasImage ? (
          <SafeImage
            fill
            src={region.image}
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 33vw"
            fallback={
              <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                {label}
              </div>
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            {label}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="font-serif text-lg font-bold text-zinc-900 group-hover:text-brand">
          {label}
        </h2>
        {region.description?.trim() ? (
          <p className="line-clamp-2 text-sm text-zinc-600">
            {region.description}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
