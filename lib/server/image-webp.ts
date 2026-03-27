import "server-only";

import sharp from "sharp";

/** Yüklenen ham görseli EXIF yönüne göre döndürüp WebP’ye çevirir (admin yüklemeleri). */
export async function bufferToWebp(
  input: Buffer,
  options?: { quality?: number }
): Promise<Buffer> {
  const quality = options?.quality ?? 85;
  return sharp(input).rotate().webp({ quality, effort: 4 }).toBuffer();
}
