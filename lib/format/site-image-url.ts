/**
 * Soru kapak görselleri (blog-images/questions/.../dosya.webp) için sitede kısa URL.
 * DB’de tam Supabase adresi durur; img src / OG için kök yol kullanılabilir.
 */
export function sitePublicImagePathFromQuestionStorageUrl(
  url: string | null | undefined
): string | null {
  const u = url?.trim();
  if (!u) return null;
  const m = u.match(/\/blog-images\/questions\/[^/]+\/([^/?#]+\.webp)$/i);
  if (!m?.[1]) return null;
  const file = m[1];
  if (!/^[^/\\?#]+-[0-9]{10,}\.webp$/i.test(file)) return null;
  return `/${file}`;
}

export function shouldUseSiteProxyWebpPath(pathOrUrl: string): boolean {
  return (
    pathOrUrl.startsWith("/") &&
    /^\/[^/\\?#]+-[0-9]{10,}\.webp$/i.test(pathOrUrl)
  );
}
