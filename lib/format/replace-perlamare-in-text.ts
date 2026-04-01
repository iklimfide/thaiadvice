/**
 * Makale / özet metinlerinde eski marka adını uzman adıyla değiştirir.
 * (Supabase patch ve import betikleri aynı kuralı kullanır.)
 */
export function replacePerlamareWithArifGuvenc(text: string): string {
  if (!text) return text;
  return text
    .replace(/PERLAMARE/g, "Arif GÜVENÇ")
    .replace(/Perlamare/g, "Arif GÜVENÇ")
    .replace(/perlamare/g, "Arif GÜVENÇ");
}
