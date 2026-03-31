type Props = {
  lang: string;
  /** URL’deki arama metni */
  initialQuery: string;
  /** Varsa GET ile korunur (kanonik slug tercih) */
  categoryValue: string | null;
};

export function HomeQuestionSearch({
  lang,
  initialQuery,
  categoryValue,
}: Props) {
  const tr = lang === "tr";

  return (
    <form
      method="get"
      action={`/${lang}`}
      className="group relative mb-8 w-full"
      role="search"
    >
      {categoryValue ? (
        <input type="hidden" name="category" value={categoryValue} />
      ) : null}
      <label className="sr-only" htmlFor="home-question-search">
        {tr ? "İçeriklerde ara" : "Search content"}
      </label>
      <input
        id="home-question-search"
        name="q"
        type="search"
        defaultValue={initialQuery}
        placeholder={
          tr
            ? "Tayland hakkında her şeyi sor… (Örn: ATM, Vize)"
            : "Ask anything about Thailand… (e.g. ATM, Visa)"
        }
        enterKeyHint="search"
        className="w-full rounded-2xl border-2 border-transparent bg-white p-4 pr-12 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-0"
      />
      <button
        type="submit"
        className="absolute right-4 top-1/2 -translate-y-1/2 text-brand transition-transform hover:scale-110"
        aria-label={tr ? "Ara" : "Search"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    </form>
  );
}
