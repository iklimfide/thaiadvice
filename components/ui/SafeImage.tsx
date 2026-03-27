"use client";

import Image from "next/image";
import { useState } from "react";

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

  if (props.fill) {
    return (
      <Image
        src={t}
        alt={props.alt ?? ""}
        fill
        className={props.className}
        sizes={props.sizes}
        priority={props.priority}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <Image
      src={t}
      alt={props.alt ?? ""}
      width={props.width}
      height={props.height}
      className={props.className}
      priority={props.priority}
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

  return (
    <div className={wrapperClassName}>
      <Image
        src={t}
        alt=""
        fill
        className={imageClassName}
        sizes={sizes}
        priority={priority}
        onError={() => setBroken(true)}
      />
    </div>
  );
}
