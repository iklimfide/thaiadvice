import { notFound } from "next/navigation";
import { getMasterUser } from "@/lib/admin/auth-server";
import { AppChrome } from "@/components/layout/AppChrome";
import { listNavQuestionCategories, listRegions } from "@/lib/data/queries";
import { resolveRouteArg } from "@/lib/next/resolve-route-args";

/** Supabase verisi statik önbelleğe girmesin */
export const dynamic = "force-dynamic";

const SUPPORTED = new Set(["tr", "en"]);

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }> | { lang: string };
}) {
  const p = await resolveRouteArg(params);
  const lang = p && typeof p.lang === "string" ? p.lang : "";
  if (!SUPPORTED.has(lang)) notFound();

  const [regions, navQuestionCategories, master] = await Promise.all([
    listRegions(),
    listNavQuestionCategories(lang),
    getMasterUser(),
  ]);

  return (
    <AppChrome
      lang={lang}
      regions={regions}
      navQuestionCategories={navQuestionCategories}
      isMaster={Boolean(master)}
    >
      {children}
    </AppChrome>
  );
}
