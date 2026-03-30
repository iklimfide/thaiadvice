type Props = {
  children: React.ReactNode;
  className?: string;
  /** Makale / mekân detayında daha belirgin başlık */
  variant?: "default" | "detail";
  /** aria-labelledby / fragment bağlantısı */
  id?: string;
};

/** Alt sayfa bölüm başlıkları — mor çubuk + ana sayfa ile uyumlu tipografi */
export function SectionTitle({
  children,
  className = "",
  variant = "default",
  id,
}: Props) {
  if (variant === "detail") {
    return (
      <h2
        id={id}
        className={`mb-4 flex min-h-[3rem] items-stretch overflow-hidden rounded-r-xl font-serif text-xl font-bold leading-snug tracking-tight text-zinc-900 shadow-sm ring-1 ring-zinc-200/90 sm:mb-5 sm:min-h-0 sm:text-2xl md:text-[1.65rem] ${className}`}
      >
        <span
          className="w-1.5 shrink-0 bg-brand sm:w-2"
          aria-hidden
        />
        <span className="flex flex-1 items-center bg-white py-3 pl-3 pr-4 sm:py-3.5 sm:pl-4 sm:pr-5">
          {children}
        </span>
      </h2>
    );
  }

  return (
    <h2
      id={id}
      className={`mb-4 flex items-center gap-3 font-serif text-xl font-bold text-zinc-900 sm:text-2xl ${className}`}
    >
      <span className="h-8 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
      {children}
    </h2>
  );
}
