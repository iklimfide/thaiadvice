/**
 * Soru kapak görselleri için eskiden kök `/{slug}-{timestamp}.webp` + `/api/image-proxy`
 * kullanılıyordu; bu yol her istekte DB + SUPABASE_SERVICE_ROLE_KEY gerektirir — anahtar
 * eksik veya sorgu hata verirse kapak görseli hiç görünmez.
 *
 * Şimdilik her zaman `null`: tarayıcı ve OG doğrudan DB’deki public Supabase URL’ine gider
 * (`blog-images` bucket’ı public olmalı). Eski kısa URL’ler `next.config` rewrite ile
 * proxy’de çalışmaya devam eder.
 */
export function sitePublicImagePathFromQuestionStorageUrl(
  _url: string | null | undefined
): string | null {
  return null;
}

export function shouldUseSiteProxyWebpPath(pathOrUrl: string): boolean {
  return (
    pathOrUrl.startsWith("/") &&
    /^\/[^/\\?#]+-[0-9]{10,}\.webp$/i.test(pathOrUrl)
  );
}
