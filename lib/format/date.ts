export function formatPostDate(iso: string, lang: string): string {
  try {
    const locale = lang === "tr" ? "tr-TR" : "en-US";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
