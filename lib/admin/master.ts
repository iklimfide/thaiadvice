import "server-only";

/** Virgülle ayrılmış e-postalar; büyük/küçük harf duyarsız. */
export function parseMasterEmails(): string[] {
  return (process.env.MASTER_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isMasterEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowed = parseMasterEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.toLowerCase());
}
