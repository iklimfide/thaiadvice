type Props = { children: React.ReactNode };

export function RibbonHeading({ children }: Props) {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="inline-flex ribbon-skew bg-brand px-6 py-2 shadow-md sm:px-10 sm:py-2.5">
        <h2 className="ribbon-unskew text-xs font-bold uppercase tracking-[0.18em] text-white sm:text-sm">
          {children}
        </h2>
      </div>
    </div>
  );
}
