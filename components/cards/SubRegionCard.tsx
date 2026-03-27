"use client";

import Link from "next/link";
import { MasterEditable } from "@/components/admin/MasterEditable";
import { SafeImage } from "@/components/ui/SafeImage";
import type { SubRegionRow } from "@/lib/types/database";

type Props = { lang: string; regionSlug: string; sub: SubRegionRow };

export function SubRegionCard({ lang, regionSlug, sub }: Props) {
  const href = `/${lang}/${regionSlug}/${sub.slug}`;
  const label = sub.name || sub.slug;
  const hasImage = Boolean(sub.image?.trim());

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-brand/40 hover:shadow-md">
      <MasterEditable
        entity="sub_region"
        id={sub.id}
        field="image"
        fieldType="image"
        label="Alt bölge kart görseli"
        initialValue={sub.image ?? ""}
        storageSlug={sub.slug}
        hasMedia={hasImage}
      >
        <Link
          href={href}
          className="relative block aspect-[16/10] w-full bg-zinc-200"
        >
          {hasImage ? (
            <SafeImage
              fill
              src={sub.image}
              className="object-cover transition group-hover:scale-[1.02]"
              sizes="(max-width:768px) 100vw, 33vw"
              fallback={
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand/15 via-violet-50 to-category/15">
                  <span className="font-serif text-lg font-bold text-brand/70">
                    {label}
                  </span>
                </div>
              }
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand/15 via-violet-50 to-category/15">
              <span className="font-serif text-lg font-bold text-brand/70">
                {label}
              </span>
            </div>
          )}
        </Link>
      </MasterEditable>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <MasterEditable
          entity="sub_region"
          id={sub.id}
          field="name"
          fieldType="text"
          label="Alt bölge adı (veritabanı)"
          initialValue={sub.name}
        >
          <Link href={href}>
            <h2 className="font-serif text-lg font-bold text-zinc-900 group-hover:text-brand">
              {label}
            </h2>
          </Link>
        </MasterEditable>
        <MasterEditable
          entity="sub_region"
          id={sub.id}
          field="description"
          fieldType="textarea"
          label="Kısa açıklama"
          initialValue={sub.description ?? ""}
          wrapClassName="mt-1 flex-1"
        >
          {sub.description?.trim() ? (
            <p className="line-clamp-2 text-sm text-zinc-600">
              {sub.description}
            </p>
          ) : (
            <p className="text-sm text-zinc-400">—</p>
          )}
        </MasterEditable>
      </div>
    </article>
  );
}
