"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ReactNode,
} from "react";

type Props = {
  src: string;
  alt: string;
  /** Tıklanabilir önizleme (ör. küçük img veya Next/Image) */
  children: ReactNode;
  /** Örn. kapak kutusu: `absolute inset-0 h-full w-full` */
  triggerClassName?: string;
};

export function ExpandableImage({
  src,
  alt,
  children,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  const label =
    alt.trim() !== ""
      ? `${alt} — büyük görüntüle`
      : "Görseli büyük görüntüle";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "group border-0 bg-transparent p-0 text-left",
          "cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
          triggerClassName ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
      >
        {children}
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex cursor-zoom-out items-center justify-center bg-black/85 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={close}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            id={titleId}
            src={src}
            alt={alt}
            className="max-h-[min(92vh,1200px)] max-w-[min(96vw,1400px)] cursor-zoom-out rounded-lg object-contain shadow-2xl ring-1 ring-white/10"
          />
        </div>
      ) : null}
    </>
  );
}
