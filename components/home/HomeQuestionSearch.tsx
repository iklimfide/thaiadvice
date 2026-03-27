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
      className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-stretch"
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
          tr ? "Sorunun cevabını ara ve bul" : "Search and find your answer"
        }
        enterKeyHint="search"
        className="min-h-[44px] w-full flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25"
      />
      <button
        type="submit"
        className="min-h-[44px] shrink-0 rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
      >
        {tr ? "Ara" : "Search"}
      </button>
    </form>
  );
}
