/**
 * Import frontmatter: yayın zamanı → Supabase `timestamptz` (ISO UTC).
 *
 * - `2026-04-02 09:00` veya `2026-04-02 09:00:00` → **Türkiye saati** (UTC+3, yaz/kış yok).
 * - ISO: `2026-04-02T06:00:00.000Z`, `2026-04-02T09:00:00+03:00` vb. → doğrudan `Date` ile.
 */

const TR_LOCAL = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

const TR_OFFSET_H = 3;

export function parseImportStatusPublishAt(
  raw: string | null | undefined
): string | null {
  const v = raw?.trim();
  if (!v) return null;

  const local = v.match(TR_LOCAL);
  if (local) {
    const y = +local[1];
    const mo = +local[2];
    const d = +local[3];
    const h = +local[4];
    const mi = +local[5];
    const sec = local[6] != null ? +local[6] : 0;
    if (
      [y, mo, d, h, mi, sec].some((n) => !Number.isFinite(n)) ||
      mo < 1 ||
      mo > 12 ||
      d < 1 ||
      d > 31 ||
      h > 23 ||
      mi > 59 ||
      sec > 59
    ) {
      return null;
    }
    const utcMs = Date.UTC(y, mo - 1, d, h - TR_OFFSET_H, mi, sec);
    const out = new Date(utcMs);
    return Number.isFinite(out.getTime()) ? out.toISOString() : null;
  }

  const parsed = new Date(v);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString();
}

/** Meta anahtarları önceliği: açık isimler, sonra STATUS */
export function metaPublishAtRaw(meta: Record<string, string>): string | undefined {
  const a = meta.PUBLISH_AT || meta.YAYIN_TARIHI || meta.STATUS;
  return a?.trim() ? a.trim() : undefined;
}
