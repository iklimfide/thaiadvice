/**
 * Yayın zamanlaması: `questions.created_at` = yayına giriş anı (UTC).
 * Gelecekteki tarih → herkese açık listelerde ve URL’de yok; master önizlemesi görür.
 */

/** Supabase `.lte("created_at", …)` için anlık üst sınır */
export function publishCutoffIso(): string {
  return new Date().toISOString();
}

export type QuestionVisibilityOpts = {
  /** `is_hidden` satırlar (master) */
  includeHidden?: boolean;
  /** `created_at` şu andan sonra olanlar (zamanlanmış) */
  includeScheduled?: boolean;
};

/** Makale detay / listeler: master oturumunda gizli + zamanlanmış dahil */
export function masterQuestionVisibility(
  masterUser: unknown
): QuestionVisibilityOpts {
  const m = Boolean(masterUser);
  return { includeHidden: m, includeScheduled: m };
}

export function isQuestionScheduledForPublish(question: {
  created_at: string;
}): boolean {
  const t = new Date(question.created_at).getTime();
  return Number.isFinite(t) && t > Date.now();
}
