"use server";

import { getMasterUser } from "@/lib/admin/auth-server";
import {
  categoryLabelForLang,
  categorySlugForUrl,
  QUESTION_CATEGORY_DEFS,
} from "@/lib/data/question-categories";
import { displayRegionTitle } from "@/lib/format/display-names";
import { getSupabaseServiceRole } from "@/lib/supabase/service";

export type InternalLinkHit = {
  title: string;
  href: string;
  kind?: "article" | "region" | "category";
};

/**
 * Master içerik editörü: site içi bağlantı önerileri — bölgeler, kategori ana sayfası filtreleri, makaleler.
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

  const qLower = q.toLowerCase();

  const regionRows = await db.from("regions").select("name,slug").order("slug", { ascending: true });
  const regionHits: InternalLinkHit[] =
    regionRows.error || !regionRows.data
      ? []
      : (regionRows.data as { name: string | null; slug: string | null }[])
          .filter((r) => {
            const name = String(r.name ?? "").toLowerCase();
            const slug = String(r.slug ?? "").toLowerCase();
            return name.includes(qLower) || slug.includes(qLower);
          })
          .slice(0, 8)
          .map((r) => {
            const slug = String(r.slug ?? "").trim();
            const label = displayRegionTitle(r.name, slug, safeLang);
            return {
              title: label,
              href: `/${safeLang}/${slug}`,
              kind: "region" as const,
            };
          });

  const categoryHits: InternalLinkHit[] = QUESTION_CATEGORY_DEFS.filter((d) => {
    const slug = d.slug.toLowerCase();
    const tr = d.labelTr.toLowerCase();
    const en = d.labelEn.toLowerCase();
    return slug.includes(qLower) || tr.includes(qLower) || en.includes(qLower);
  })
    .slice(0, 8)
    .map((d) => ({
      title: categoryLabelForLang(d.slug, safeLang),
      href: `/${safeLang}?category=${encodeURIComponent(d.slug)}#latest-posts`,
      kind: "category" as const,
    }));

  const articleHits: InternalLinkHit[] = [...map.values()].slice(0, 14).map((r) => ({
    title: r.title || r.slug,
    href: `/${r.lang}/${r.region}/${categorySlugForUrl(r.category)}/${r.slug}`,
    kind: "article" as const,
  }));

  return [...regionHits, ...categoryHits, ...articleHits].slice(0, 24);
}
