"use server";

import { getMasterUser } from "@/lib/admin/auth-server";
import { categorySlugForUrl } from "@/lib/data/question-categories";
import { getSupabaseServiceRole } from "@/lib/supabase/service";

export type InternalLinkHit = {
  title: string;
  href: string;
};

/**
 * Master içerik editörü: site içi makale bağlantısı önerileri (mevcut sayfa dili).
 */
export async function searchInternalArticleLinks(
  rawQuery: string,
  lang: string
): Promise<InternalLinkHit[]> {
  const user = await getMasterUser();
  if (!user) return [];

  const q = rawQuery.trim().replace(/%/g, "").replace(/_/g, "").slice(0, 80);
  if (q.length < 2) return [];

  const safeLang = lang === "en" ? "en" : "tr";
  const pat = `%${q}%`;
  const db = getSupabaseServiceRole();
  const sel = "id,title,slug,region,category,lang";

  const [byTitle, bySlug] = await Promise.all([
    db.from("questions").select(sel).eq("lang", safeLang).ilike("title", pat).limit(14),
    db.from("questions").select(sel).eq("lang", safeLang).ilike("slug", pat).limit(14),
  ]);

  if (byTitle.error || bySlug.error) return [];

  const map = new Map<
    string,
    { title: string; slug: string; region: string; category: string; lang: string }
  >();

  for (const row of [...(byTitle.data ?? []), ...(bySlug.data ?? [])]) {
    const id = String(row.id ?? "");
    if (!id || map.has(id)) continue;
    map.set(id, {
      title: String(row.title ?? ""),
      slug: String(row.slug ?? ""),
      region: String(row.region ?? ""),
      category: String(row.category ?? ""),
      lang: String(row.lang ?? safeLang),
    });
  }

  return [...map.values()].slice(0, 18).map((r) => ({
    title: r.title || r.slug,
    href: `/${r.lang}/${r.region}/${categorySlugForUrl(r.category)}/${r.slug}`,
  }));
}
