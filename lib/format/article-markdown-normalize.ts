/**
 * Makale gövdesi markdown — şablona yaklaştırır (tek # bölüm başlığı → ##).
 * Böylece tüm yazılar `article-detail-body` içinde aynı h3 ✦ / liste stiline yaklaşır.
 */
export function normalizeArticleBodyMarkdown(md: string): string {
  if (!md.trim()) return md;
  return md
    .split("\n")
    .map((line) => {
      // Yalnızca tek # + boşluk (## veya ### değil)
      const m = line.match(/^(\s*)# (\S.*)$/);
      if (m) return `${m[1]}## ${m[2]}`;
      return line;
    })
    .join("\n");
}
