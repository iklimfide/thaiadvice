import Link from "next/link";
import type { SubRegionRow } from "@/lib/types/database";

type Props = { lang: string; regionSlug: string; sub: SubRegionRow };

export function SubRegionCard({ lang, regionSlug, sub }: Props) {
  const href = `/${lang}/${regionSlug}/${sub.slug}`;
  const label = sub.name || sub.slug;

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-brand/40 hover:shadow-md"
    >
      <div className="relative flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-brand/15 via-violet-50 to-category/15">
        <span className="font-serif text-lg font-bold text-brand/70">
          {label}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="font-serif text-lg font-bold text-zinc-900 group-hover:text-brand">
          {label}
        </h2>
        {sub.description?.trim() ? (
          <p className="line-clamp-2 text-sm text-zinc-600">{sub.description}</p>
        ) : null}
      </div>
    </Link>
  );
}
