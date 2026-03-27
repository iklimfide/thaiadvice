"use client";

import Link from "next/link";
import { MasterEditable } from "@/components/admin/MasterEditable";
import { SafeImage } from "@/components/ui/SafeImage";
import { displayRegionTitle } from "@/lib/format/display-names";
import type { RegionRow } from "@/lib/types/database";

type Props = { lang: string; region: RegionRow };

export function RegionCard({ lang, region }: Props) {
  const href = `/${lang}/${region.slug}`;
  const label = displayRegionTitle(region.name, region.slug, lang);
  const hasImage = Boolean(region.image?.trim());

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-brand/40 hover:shadow-md">
      <MasterEditable
        entity="region"
        id={region.id}
        field="image"
        fieldType="image"
        label="Destinasyon kart görseli"
        initialValue={region.image ?? ""}
        storageSlug={region.slug}
        hasMedia={hasImage}
      >
        <Link
          href={href}
          className="relative block aspect-[16/10] w-full bg-zinc-200"
        >
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
        </Link>
      </MasterEditable>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <MasterEditable
          entity="region"
          id={region.id}
          field="name"
          fieldType="text"
          label="Bölge adı (veritabanı)"
          initialValue={region.name}
        >
          <Link href={href}>
            <h2 className="font-serif text-lg font-bold text-zinc-900 group-hover:text-brand">
              {label}
            </h2>
          </Link>
        </MasterEditable>
        <MasterEditable
          entity="region"
          id={region.id}
          field="description"
          fieldType="textarea"
          label="Kısa açıklama"
          initialValue={region.description ?? ""}
          wrapClassName="mt-1 flex-1"
        >
          {region.description?.trim() ? (
            <p className="line-clamp-2 text-sm text-zinc-600">
              {region.description}
            </p>
          ) : (
            <p className="text-sm text-zinc-400">—</p>
          )}
        </MasterEditable>
      </div>
    </article>
  );
}
