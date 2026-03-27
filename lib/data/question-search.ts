import type { QuestionRow } from "@/lib/types/database";

function normalizeForSearch(s: string, locale: string): string {
  return s.normalize("NFKC").toLocaleLowerCase(locale);
}

/**
 * Boşlukla ayrılmış her kelime, başlık + içerik + özet içinde geçmeli (büyük/küçük harf duyarsız).
 */
export function filterQuestionsByTextQuery(
  questions: QuestionRow[],
  rawQuery: string,
  lang: string
): QuestionRow[] {
  const locale = lang === "tr" ? "tr" : "en";
  const trimmed = rawQuery.trim();
  if (!trimmed) return questions;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return questions;

  return questions.filter((row) => {
    const haystack = normalizeForSearch(
      [row.title, row.content, row.excerpt ?? ""].join("\n"),
      locale
    );
    return words.every((w) =>
      haystack.includes(normalizeForSearch(w, locale))
    );
  });
}
