"use client";

import Image from "next/image";
import { useState } from "react";
import {
  shouldUseSiteProxyWebpPath,
  sitePublicImagePathFromQuestionStorageUrl,
} from "@/lib/format/site-image-url";

function displaySrcForImage(src: string): string {
  const short = sitePublicImagePathFromQuestionStorageUrl(src);
  return short ?? src;
}

/** Site kökü .webp veya Supabase: `/_next/image` proxy’si kullanılmasın */
function unoptimizedForSrc(displaySrc: string, originalSrc: string): boolean {
  if (shouldUseSiteProxyWebpPath(displaySrc)) return true;
  return /supabase\.co\/storage\//i.test(originalSrc);
}

type Base = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  priority?: boolean;
  /** Boş / geçersiz src veya yükleme hatasında gösterilir */
  fallback: React.ReactNode;
};

type SafeFill = Base & {
  fill: true;
  sizes: string;
};

type SafeFixed = Base & {
  fill?: false;
  width: number;
  height: number;
};

export type SafeImageProps = SafeFill | SafeFixed;

/**
 * `fill` kullanıldığında üst öğe `position: relative` ve boyutlu olmalıdır.
 * onError ile kırık linkte görsel yoksayılır, `fallback` gösterilir.
 */
export function SafeImage(props: SafeImageProps) {
  const [broken, setBroken] = useState(false);
  const t = typeof props.src === "string" ? props.src.trim() : "";

  if (!t || broken) {
    return <>{props.fallback}</>;
  }

  const d = displaySrcForImage(t);
  const unopt = unoptimizedForSrc(d, t);

  if (props.fill) {
    return (
      <Image
        src={d}
        alt={props.alt ?? ""}
        fill
        className={props.className}
        sizes={props.sizes}
        priority={props.priority}
        unoptimized={unopt}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <Image
      src={d}
      alt={props.alt ?? ""}
      width={props.width}
      height={props.height}
      className={props.className}
      priority={props.priority}
      unoptimized={unopt}
      onError={() => setBroken(true)}
    />
  );
}

type SafeHeroBoxProps = {
  src: string | null | undefined;
  wrapperClassName: string;
  imageClassName?: string;
  sizes: string;
  priority?: boolean;
};

/** Kapak görseli: src yok veya kırık ise tüm kutu (layout dahil) render edilmez */
export function SafeHeroImageBox({
  src,
  wrapperClassName,
  imageClassName,
  sizes,
  priority,
}: SafeHeroBoxProps) {
  const [broken, setBroken] = useState(false);
  const t = typeof src === "string" ? src.trim() : "";

  if (!t || broken) {
    return null;
  }

  const d = displaySrcForImage(t);

  return (
    <div className={wrapperClassName}>
      <Image
        src={d}
        alt=""
        fill
        className={imageClassName}
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimizedForSrc(d, t)}
        onError={() => setBroken(true)}
      />
    </div>
  );
}
