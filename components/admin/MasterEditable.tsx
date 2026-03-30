"use client";

import {
  masterSetQuestionHidden,
  masterUpdatePlaceField,
  masterUpdateQuestionField,
  masterUpdateQuestionRelatedSlugs,
  masterUpdateRegionField,
  masterUpdateSubRegionField,
  masterUploadPlaceImage,
  masterUploadRegionImage,
  masterUploadSubRegionImage,
  type MasterInlineState,
} from "@/lib/actions/master-inline";
import {
  setQuestionImageUrl,
  uploadQuestionImage,
  type ModerationState,
} from "@/lib/actions/moderation";
import { useParams, usePathname } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { useMaster } from "./MasterContext";

type FieldType =
  | "text"
  | "textarea"
  | "image"
  | "related_slugs"
  | "select_price"
  | "rating";

type Props = {
  entity: "question" | "place" | "region" | "sub_region";
  id: string;
  field: string;
  fieldType: FieldType;
  label: string;
  initialValue: string;
  children: React.ReactNode;
  /** Storage dosya adı için (ör. makale / mekân slug); yoksa URL’deki [slug] veya id kısaltması */
  storageSlug?: string;
  /** fieldType image: içerik yoksa bile master’a çerçeve göster */
  hasMedia?: boolean;
  wrapClassName?: string;
  /** Yalnız entity=question; başlık satırında Gizle/Göster */
  showQuestionVisibilityToggle?: boolean;
  questionIsHidden?: boolean;
};

const initialInline: MasterInlineState = { ok: true };
const initialMod: ModerationState = { ok: true };

export function MasterEditable({
  entity,
  id,
  field,
  fieldType,
  label,
  initialValue,
  children,
  storageSlug,
  hasMedia = true,
  wrapClassName = "",
  showQuestionVisibilityToggle = false,
  questionIsHidden = false,
}: Props) {
  const { isMaster } = useMaster();
  const pathname = usePathname();
  const params = useParams();
  const lang =
    typeof params.lang === "string" ? params.lang : "tr";
  const routeSlug =
    typeof params.slug === "string" ? params.slug : "";
  const slugForStorage =
    storageSlug?.trim() || routeSlug || id.replace(/-/g, "").slice(0, 12);
  const [open, setOpen] = useState(false);

  const [qState, qAction] = useActionState(
    masterUpdateQuestionField,
    initialInline
  );
  const [relState, relAction] = useActionState(
    masterUpdateQuestionRelatedSlugs,
    initialInline
  );
  const [pState, pAction] = useActionState(
    masterUpdatePlaceField,
    initialInline
  );
  const [rState, rAction] = useActionState(
    masterUpdateRegionField,
    initialInline
  );
  const [regionUrlState, regionUrlAction] = useActionState(
    masterUpdateRegionField,
    initialInline
  );

  const [imgUrlState, imgUrlAction] = useActionState(
    setQuestionImageUrl,
    initialMod
  );
  const [imgUpState, imgUpAction] = useActionState(
    uploadQuestionImage,
    initialMod
  );
  const [placeUrlState, placeUrlAction] = useActionState(
    masterUpdatePlaceField,
    initialInline
  );
  const [placeUpState, placeUpAction] = useActionState(
    masterUploadPlaceImage,
    initialInline
  );
  const [regionUpState, regionUpAction] = useActionState(
    masterUploadRegionImage,
    initialInline
  );
  const [srState, srAction] = useActionState(
    masterUpdateSubRegionField,
    initialInline
  );
  const [subRegionUrlState, subRegionUrlAction] = useActionState(
    masterUpdateSubRegionField,
    initialInline
  );
  const [subRegionUpState, subRegionUpAction] = useActionState(
    masterUploadSubRegionImage,
    initialInline
  );
  const [visState, visAction] = useActionState(
    masterSetQuestionHidden,
    initialInline
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!isMaster) {
    if (fieldType === "image" && !hasMedia) {
      return null;
    }
    return <>{children}</>;
  }

  const btnClass =
    "shrink-0 rounded border border-amber-300 bg-amber-100/80 px-2 py-0.5 text-xs font-medium text-amber-950 hover:bg-amber-200/90";
  const visBtnClass = questionIsHidden
    ? "shrink-0 rounded border border-emerald-400 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-950 hover:bg-emerald-100"
    : "shrink-0 rounded border border-zinc-400 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 hover:bg-zinc-200";

  const showImageShell = fieldType === "image" && !hasMedia;
  const showVis =
    entity === "question" && showQuestionVisibilityToggle;

  return (
    <div className={wrapClassName}>
      <div
        className={
          showImageShell
            ? "mb-8 flex min-h-[100px] flex-col items-stretch gap-2 rounded-xl border-2 border-dashed border-amber-300/70 bg-amber-50/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            : "flex flex-wrap items-start gap-2"
        }
      >
        <div className={showImageShell ? "flex-1 text-sm text-amber-900" : "min-w-0 flex-1"}>
          {showImageShell ? (
            <span>Kapak görseli yok.</span>
          ) : (
            children
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <button type="button" className={btnClass} onClick={() => setOpen(true)}>
            Değiştir
          </button>
          {showVis ? (
            <form action={visAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="pathname" value={pathname} />
              <input type="hidden" name="lang" value={lang} />
              <input
                type="hidden"
                name="is_hidden"
                value={questionIsHidden ? "false" : "true"}
              />
              <button type="submit" className={visBtnClass}>
                {questionIsHidden ? "Göster" : "Gizle"}
              </button>
            </form>
          ) : null}
        </div>
      </div>
      {showVis && visState.message ? (
        <p
          className={
            visState.ok ? "mt-1 text-xs text-emerald-700" : "mt-1 text-xs text-red-600"
          }
        >
          {visState.message}
        </p>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-labelledby="master-edit-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2
              id="master-edit-title"
              className="text-lg font-semibold text-zinc-900"
            >
              {label}
            </h2>

            {fieldType === "image" && entity === "question" ? (
              <div className="mt-4 space-y-6">
                <form action={imgUrlAction} className="space-y-2">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="slug" value={slugForStorage} />
                  <input type="hidden" name="pathname" value={pathname} />
                  <input type="hidden" name="lang" value={lang} />
                  <label className="text-sm font-medium">Görsel URL</label>
                  <input
                    name="image_url"
                    type="url"
                    defaultValue={initialValue}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    placeholder="https://..."
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
                  >
                    URL kaydet
                  </button>
                  {imgUrlState.message ? (
                    <p
                      className={
                        imgUrlState.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"
                      }
                    >
                      {imgUrlState.message}
                    </p>
                  ) : null}
                </form>
                <form
                  action={imgUpAction}
                  className="space-y-2 border-t border-zinc-100 pt-4"
                >
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="slug" value={slugForStorage} />
                  <input type="hidden" name="pathname" value={pathname} />
                  <input type="hidden" name="lang" value={lang} />
                  <label className="text-sm font-medium">Dosya yükle</label>
                  <input
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                  >
                    Storage’a yükle
                  </button>
                  {imgUpState.message ? (
                    <p
                      className={
                        imgUpState.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"
                      }
                    >
                      {imgUpState.message}
                    </p>
                  ) : null}
                </form>
              </div>
            ) : null}

            {fieldType === "image" && entity === "place" ? (
              <div className="mt-4 space-y-6">
                <form action={placeUrlAction} className="space-y-2">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="field" value="image" />
                  <input type="hidden" name="storage_slug" value={slugForStorage} />
                  <input type="hidden" name="pathname" value={pathname} />
                  <input type="hidden" name="lang" value={lang} />
                  <label className="text-sm font-medium">Görsel URL</label>
                  <input
                    name="value"
                    type="url"
                    defaultValue={initialValue}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
                  >
                    URL kaydet
                  </button>
                  {placeUrlState.message ? (
                    <p
                      className={
                        placeUrlState.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"
                      }
                    >
                      {placeUrlState.message}
                    </p>
                  ) : null}
                </form>
                <form
                  action={placeUpAction}
                  className="space-y-2 border-t border-zinc-100 pt-4"
                >
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="storage_slug" value={slugForStorage} />
                  <input type="hidden" name="pathname" value={pathname} />
                  <input type="hidden" name="lang" value={lang} />
                  <label className="text-sm font-medium">Dosya yükle</label>
                  <input
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                  >
                    Storage’a yükle
                  </button>
                  {placeUpState.message ? (
                    <p
                      className={
                        placeUpState.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"
                      }
                    >
                      {placeUpState.message}
                    </p>
                  ) : null}
                </form>
              </div>
            ) : null}

            {fieldType === "image" && entity === "region" ? (
              <div className="mt-4 space-y-6">
                <form action={regionUrlAction} className="space-y-2">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="field" value="image" />
                  <input type="hidden" name="storage_slug" value={slugForStorage} />
                  <input type="hidden" name="pathname" value={pathname} />
                  <input type="hidden" name="lang" value={lang} />
                  <label className="text-sm font-medium">Görsel URL</label>
                  <input
                    name="value"
                    type="url"
                    defaultValue={initialValue}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
                  >
                    URL kaydet
                  </button>
                  {regionUrlState.message ? (
                    <p
                      className={
                        regionUrlState.ok
                          ? "text-sm text-emerald-700"
                          : "text-sm text-red-600"
                      }
                    >
                      {regionUrlState.message}
                    </p>
                  ) : null}
                </form>
                <form
                  action={regionUpAction}
                  className="space-y-2 border-t border-zinc-100 pt-4"
                >
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="storage_slug" value={slugForStorage} />
                  <input type="hidden" name="pathname" value={pathname} />
                  <input type="hidden" name="lang" value={lang} />
                  <label className="text-sm font-medium">Dosya yükle</label>
                  <input
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                  >
                    Storage’a yükle
                  </button>
                  {regionUpState.message ? (
                    <p
                      className={
                        regionUpState.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"
                      }
                    >
                      {regionUpState.message}
                    </p>
                  ) : null}
                </form>
              </div>
            ) : null}

            {fieldType === "image" && entity === "sub_region" ? (
              <div className="mt-4 space-y-6">
                <form action={subRegionUrlAction} className="space-y-2">
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="field" value="image" />
                  <input type="hidden" name="storage_slug" value={slugForStorage} />
                  <input type="hidden" name="pathname" value={pathname} />
                  <input type="hidden" name="lang" value={lang} />
                  <label className="text-sm font-medium">Görsel URL</label>
                  <input
                    name="value"
                    type="url"
                    defaultValue={initialValue}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
                  >
                    URL kaydet
                  </button>
                  {subRegionUrlState.message ? (
                    <p
                      className={
                        subRegionUrlState.ok
                          ? "text-sm text-emerald-700"
                          : "text-sm text-red-600"
                      }
                    >
                      {subRegionUrlState.message}
                    </p>
                  ) : null}
                </form>
                <form
                  action={subRegionUpAction}
                  className="space-y-2 border-t border-zinc-100 pt-4"
                >
                  <input type="hidden" name="id" value={id} />
                  <input type="hidden" name="storage_slug" value={slugForStorage} />
                  <input type="hidden" name="pathname" value={pathname} />
                  <input type="hidden" name="lang" value={lang} />
                  <label className="text-sm font-medium">Dosya yükle</label>
                  <input
                    name="file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm"
                  >
                    Storage’a yükle
                  </button>
                  {subRegionUpState.message ? (
                    <p
                      className={
                        subRegionUpState.ok
                          ? "text-sm text-emerald-700"
                          : "text-sm text-red-600"
                      }
                    >
                      {subRegionUpState.message}
                    </p>
                  ) : null}
                </form>
              </div>
            ) : null}

            {fieldType === "related_slugs" ? (
              <form action={relAction} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="pathname" value={pathname} />
                <input type="hidden" name="lang" value={lang} />
                <textarea
                  name="value"
                  rows={5}
                  defaultValue={initialValue}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm"
                  placeholder="slug-1, slug-2"
                />
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
                >
                  Kaydet
                </button>
                {relState.message ? (
                  <p
                    className={
                      relState.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"
                    }
                  >
                    {relState.message}
                  </p>
                ) : null}
              </form>
            ) : null}

            {fieldType === "select_price" && entity === "place" ? (
              <form action={pAction} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="field" value="price_level" />
                <input type="hidden" name="pathname" value={pathname} />
                <input type="hidden" name="lang" value={lang} />
                <select
                  name="value"
                  defaultValue={initialValue}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="$">$</option>
                  <option value="$$">$$</option>
                  <option value="$$$">$$$</option>
                </select>
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
                >
                  Kaydet
                </button>
                {pState.message ? (
                  <p
                    className={
                      pState.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"
                    }
                  >
                    {pState.message}
                  </p>
                ) : null}
              </form>
            ) : null}

            {fieldType === "rating" && entity === "place" ? (
              <form action={pAction} className="mt-4 space-y-3">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="field" value="rating" />
                <input type="hidden" name="pathname" value={pathname} />
                <input type="hidden" name="lang" value={lang} />
                <input
                  name="value"
                  type="number"
                  step="0.1"
                  min="0"
                  defaultValue={initialValue}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
                >
                  Kaydet
                </button>
                {pState.message ? (
                  <p
                    className={
                      pState.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"
                    }
                  >
                    {pState.message}
                  </p>
                ) : null}
              </form>
            ) : null}

            {fieldType === "text" || fieldType === "textarea" ? (
              <form
                action={
                  entity === "question"
                    ? qAction
                    : entity === "region"
                      ? rAction
                      : entity === "sub_region"
                        ? srAction
                        : pAction
                }
                className="mt-4 space-y-3"
              >
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="field" value={field} />
                <input type="hidden" name="pathname" value={pathname} />
                <input type="hidden" name="lang" value={lang} />
                {entity === "question" && field === "image_url" ? (
                  <input type="hidden" name="storage_slug" value={slugForStorage} />
                ) : null}
                {fieldType === "textarea" ? (
                  <textarea
                    name="value"
                    rows={field === "content" ? 18 : 8}
                    defaultValue={initialValue}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                ) : (
                  <input
                    name="value"
                    type="text"
                    defaultValue={initialValue}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                )}
                <button
                  type="submit"
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
                >
                  Kaydet
                </button>
                {(entity === "question"
                  ? qState
                  : entity === "region"
                    ? rState
                    : entity === "sub_region"
                      ? srState
                      : pState
                ).message ? (
                  <p
                    className={
                      (entity === "question"
                        ? qState
                        : entity === "region"
                          ? rState
                          : entity === "sub_region"
                            ? srState
                            : pState
                      ).ok
                        ? "text-sm text-emerald-700"
                        : "text-sm text-red-600"
                    }
                  >
                    {
                      (entity === "question"
                        ? qState
                        : entity === "region"
                          ? rState
                          : entity === "sub_region"
                            ? srState
                            : pState
                      ).message
                    }
                  </p>
                ) : null}
              </form>
            ) : null}

            <button
              type="button"
              className="mt-6 w-full rounded-md border border-zinc-300 py-2 text-sm text-zinc-700"
              onClick={() => setOpen(false)}
            >
              Kapat
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
