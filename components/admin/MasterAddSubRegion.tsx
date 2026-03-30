"use client";

import {
  masterInsertSubRegion,
  type MasterInsertSubRegionState,
} from "@/lib/actions/master-inline";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { useMaster } from "./MasterContext";

const initial: MasterInsertSubRegionState = { ok: false };

type Props = {
  regionId: string;
  lang: string;
};

export function MasterAddSubRegion({ regionId, lang }: Props) {
  const { isMaster } = useMaster();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const lastSuccessMsg = useRef<string>("");
  const [state, formAction] = useFormState(masterInsertSubRegion, initial);

  useEffect(() => {
    if (!state.ok || !state.message) return;
    if (state.message === lastSuccessMsg.current) return;
    lastSuccessMsg.current = state.message;
    setFormKey((k) => k + 1);
    setOpen(false);
    router.refresh();
  }, [state, router]);

  if (!isMaster) return null;

  const tr = lang === "tr";

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950">
      <button
        type="button"
        className="font-medium text-amber-900 underline-offset-2 hover:underline"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open
          ? tr
            ? "Formu gizle"
            : "Hide form"
          : tr
            ? "+ Yeni alt bölge ekle"
            : "+ Add sub-region"}
      </button>
      {open ? (
        <form
          key={formKey}
          action={formAction}
          className="mt-3 space-y-3 border-t border-amber-200/80 pt-3"
        >
          <input type="hidden" name="region_id" value={regionId} />
          <input type="hidden" name="pathname" value={pathname} />
          <input type="hidden" name="lang" value={lang} />
          <div>
            <label className="mb-1 block text-xs font-medium text-amber-900">
              {tr ? "Görünen ad" : "Display name"}
            </label>
            <input
              name="name"
              required
              maxLength={200}
              className="w-full rounded-md border border-amber-300/80 bg-white px-3 py-2 text-zinc-900"
              placeholder={tr ? "Örn. Phuket" : "e.g. Phuket"}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-amber-900">
              {tr ? "URL slug (isteğe bağlı)" : "URL slug (optional)"}
            </label>
            <input
              name="slug"
              maxLength={80}
              className="w-full rounded-md border border-amber-300/80 bg-white px-3 py-2 font-mono text-sm text-zinc-900"
              placeholder={tr ? "Boş: addan üretilir (phuket)" : "Empty: derived from name"}
            />
            <p className="mt-1 text-xs text-amber-800/80">
              {tr
                ? "Sayfa adresi: /…/bölge-slug/bu-slug"
                : "Page path: /…/region-slug/this-slug"}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-amber-900">
              {tr ? "Kısa açıklama (isteğe bağlı)" : "Short description (optional)"}
            </label>
            <textarea
              name="description"
              rows={2}
              maxLength={2000}
              className="w-full rounded-md border border-amber-300/80 bg-white px-3 py-2 text-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900"
          >
            {tr ? "Alt bölgeyi oluştur" : "Create sub-region"}
          </button>
          {state.message ? (
            <p
              className={
                state.ok ? "text-sm text-emerald-800" : "text-sm text-red-700"
              }
            >
              {state.message}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
