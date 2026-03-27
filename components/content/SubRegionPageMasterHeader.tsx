"use client";

import { MasterEditable } from "@/components/admin/MasterEditable";
import { SafeImage } from "@/components/ui/SafeImage";
import type { SubRegionRow } from "@/lib/types/database";

type Props = { sub: SubRegionRow };

export function SubRegionPageMasterHeader({ sub }: Props) {
  const title = sub.name || sub.slug;
  const hasImage = Boolean(sub.image?.trim());

  return (
    <header className="mb-8 border-b border-zinc-200 pb-8">
      <MasterEditable
        entity="sub_region"
        id={sub.id}
        field="image"
        fieldType="image"
        label="Alt bölge kapak görseli"
        initialValue={sub.image ?? ""}
        storageSlug={sub.slug}
        hasMedia={hasImage}
        wrapClassName="mb-6"
      >
        {hasImage ? (
          <div className="relative aspect-[21/9] w-full max-w-4xl overflow-hidden rounded-xl bg-zinc-200">
            <SafeImage
              fill
              src={sub.image}
              className="object-cover"
              sizes="(max-width:896px) 100vw, 896px"
              fallback={
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                  {title}
                </div>
              }
            />
          </div>
        ) : null}
      </MasterEditable>

      <MasterEditable
        entity="sub_region"
        id={sub.id}
        field="name"
        fieldType="text"
        label="Alt bölge adı (veritabanı)"
        initialValue={sub.name}
      >
        <h1 className="font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">
          {title}
        </h1>
      </MasterEditable>

      <MasterEditable
        entity="sub_region"
        id={sub.id}
        field="description"
        fieldType="textarea"
        label="Giriş metni / açıklama"
        initialValue={sub.description ?? ""}
        wrapClassName="mt-3"
      >
        {sub.description?.trim() ? (
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-600">
            {sub.description}
          </p>
        ) : (
          <p className="text-sm text-zinc-400">—</p>
        )}
      </MasterEditable>
    </header>
  );
}
