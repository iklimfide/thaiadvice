"use client";

import Link from "next/link";
import { useMaster } from "@/components/admin/MasterContext";

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
};

/** Ziyaretçi: kategori listesine gider. Master: link yok (düzenleme ile çakışmasın). */
export function CategoryPageLink({ href, className, children }: Props) {
  const { isMaster } = useMaster();
  if (isMaster) {
    return <span className={className}>{children}</span>;
  }
  return (
    <Link
      href={href}
      className={[className, "hover:underline"].filter(Boolean).join(" ")}
    >
      {children}
    </Link>
  );
}
