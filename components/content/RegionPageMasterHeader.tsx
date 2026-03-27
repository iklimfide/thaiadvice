"use client";

import { MasterEditable } from "@/components/admin/MasterEditable";
import { SafeImage } from "@/components/ui/SafeImage";
import { displayRegionTitle } from "@/lib/format/display-names";
import type { RegionRow } from "@/lib/types/database";

type Props = { lang: string; region: RegionRow };

/**
 * Bölge detay sayfası: master için kapak görseli + başlık + açıklama düzenleme.
 */
export function RegionPageMasterHeader({ lang, region }: Props) {
  const regionTitle = displayRegionTitle(region.name, region.slug, lang);
  const hasImage = Boolean(region.image?.trim());

  return (
    <header className="mb-8 border-b border-zinc-200 pb-8">
      <MasterEditable
        entity="region"
        id={region.id}
        field="image"
        fieldType="image"
        label="Destinasyon kapak görseli"
        initialValue={region.image ?? ""}
        storageSlug={region.slug}
        hasMedia={hasImage}
        wrapClassName="mb-6"
      >
        {hasImage ? (
          <div className="relative aspect-[21/9] w-full max-w-4xl overflow-hidden rounded-xl bg-zinc-200">
            <SafeImage
              fill
              src={region.image}
              className="object-cover"
              sizes="(max-width:896px) 100vw, 896px"
              fallback={
                <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
                  {regionTitle}
                </div>
              }
            />
          </div>
        ) : null}
      </MasterEditable>

      <MasterEditable
        entity="region"
        id={region.id}
        field="name"
        fieldType="text"
        label="Bölge adı (veritabanı)"
        initialValue={region.name}
      >
        <h1 className="font-serif text-3xl font-bold text-zinc-900 sm:text-4xl">
          {regionTitle}
        </h1>
      </MasterEditable>

      <MasterEditable
        entity="region"
        id={region.id}
        field="description"
        fieldType="textarea"
        label="Giriş metni / açıklama"
        initialValue={region.description ?? ""}
        wrapClassName="mt-3"
      >
        {region.description?.trim() ? (
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-600">
            {region.description}
          </p>
        ) : (
          <p className="text-sm text-zinc-400">—</p>
        )}
      </MasterEditable>
    </header>
  );
}
