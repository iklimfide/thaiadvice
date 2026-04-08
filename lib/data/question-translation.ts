import type { QuestionRow } from "@/lib/types/database";

/** TR↔EN aynı makale eşlemesi (translate script ile aynı format). */
export function questionTranslationKey(q: {
  region: string;
  category: string;
  slug: string;
}): string {
  return `${q.region}\t${q.category}\t${q.slug}`;
}

/**
 * Master TR listeleri: İngilizce satırı olmayan makaleler önce, sonra created_at azalan.
 */
export function sortTurkishQuestionsWithMissingEnglishFirst(
  questions: QuestionRow[],
  englishKeys: Set<string>
): QuestionRow[] {
  return [...questions].sort((a, b) => {
    const aMissing = !englishKeys.has(questionTranslationKey(a));
    const bMissing = !englishKeys.has(questionTranslationKey(b));
    if (aMissing !== bMissing) return aMissing ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}
