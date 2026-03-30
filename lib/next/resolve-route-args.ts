/**
 * Next 14: params / searchProps nesne; Next 15+: Promise olabilir.
 * Eksik prop (undefined) durumunda destructuring çökmesin diye tek yerden çözülür.
 */
export async function resolveRouteArg<T extends object>(
  value: T | Promise<T> | undefined | null
): Promise<T | null> {
  if (value == null) return null;
  const resolved = await Promise.resolve(value);
  return resolved ?? null;
}
