/**
 * “Hızlı Cevap:” etiketi — SSS, özet ve makale gövdesinde tekrarı önlemek için.
 * Unicode Türkçe ı + ASCII “Hizli” yazımı.
 */

/** Yalnızca satır başı etiket (içerik aynı kalır) — tekrarlayarak sil */
/** `g` yok: aynı RegExp nesnesinde `lastIndex` kalmasın; while ile tekrarlanan etiket silinir */
const LABEL_ONLY =
  /^\s*(?:\*{1,2})?\s*H[ıi]zl[ıi]\s+Cevap\s*(?:\*{1,2})?\s*:\s*/i;

/** Makale gövdesinde excerpt ile aynı blok (import formatı + düz paragraf) */
const MD_QUICK_BLOCKS: RegExp[] = [
  />\s*\*\*H[ıi]zl[ıi]\s+Cevap:\*\*\s*[\s\S]+?(?=\r?\n\r?\n|\r?\n##|\r?\n###\s*\[\s*DİL|$)/i,
  /^(?:\*{1,2})?\s*H[ıi]zl[ıi]\s+Cevap\s*(?:\*{1,2})?\s*:\s*[\s\S]+?(?=\r?\n\r?\n|\r?\n##|\r?\n###\s*\[\s*DİL|$)/i,
];

export function stripQuickAnswerPrefix(text: string): string {
  let t = text.trimStart();
  let prev = "";
  while (t !== prev) {
    prev = t;
    t = t.replace(LABEL_ONLY, "").trimStart();
  }
  return t;
}

/** @deprecated isim uyumu — SSS cevap satırı için */
export function stripFaqQuickAnswerPrefix(text: string): string {
  return stripQuickAnswerPrefix(text);
}

/** Markdown’ta baştaki “Hızlı Cevap” paragrafını / alıntısını kaldır (DB’de eski içerik için) */
export function stripLeadingQuickAnswerBlockFromMarkdown(md: string): string {
  let s = md.trimStart();
  for (const re of MD_QUICK_BLOCKS) {
    const m = s.match(re);
    if (m && m.index === 0) {
      s = s.slice(m[0].length).trimStart();
      break;
    }
  }
  return stripQuickAnswerPrefix(s);
}

/** Soru yalnızca “Hızlı cevap” etiketiyse <dt> gösterme */
export function isFaqQuestionOnlyQuickAnswerLabel(question: string): boolean {
  const q = question.trim();
  return /^\s*(?:\*{1,2})?\s*H[ıi]zl[ıi]\s+Cevap\s*(?:\*{1,2})?\s*:?\s*$/i.test(
    q
  );
}
