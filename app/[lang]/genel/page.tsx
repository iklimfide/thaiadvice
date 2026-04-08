import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { RibbonHeading } from "@/components/home/RibbonHeading";
import { PostCard } from "@/components/home/PostCard";
import { pageMetadata } from "@/lib/metadata/site";
import { resolveRouteArg } from "@/lib/next/resolve-route-args";
import { SITE_LANGS } from "@/lib/seo/site-languages";
import {
  fetchEnglishQuestionTranslationKeys,
  listQuestionsForLang,
} from "@/lib/data/queries";
import { getMasterUser } from "@/lib/admin/auth-server";
import { masterQuestionVisibility } from "@/lib/data/question-visibility";
import { sortTurkishQuestionsWithMissingEnglishFirst } from "@/lib/data/question-translation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ lang: string }> | { lang: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await resolveRouteArg(params);
  if (!p || typeof p.lang !== "string") notFound();
  const { lang } = p;

  const title = lang === "tr" ? "Genel" : "General";
  const description =
    lang === "tr"
      ? "Genel içerikler, duyurular ve Tayland hakkında genel bilgiler."
      : "General posts and overall Thailand information.";

  const languagePaths: Partial<Record<string, string>> = {};
  for (const l of SITE_LANGS) languagePaths[l] = `/${l}/genel`;

  return pageMetadata({
    title,
    description,
    image: null,
    path: `/${lang}/genel`,
    locale: lang,
    languagePaths,
  });
}

export default async function GeneralLandingPage({ params }: Props) {
  const p = await resolveRouteArg(params);
  if (!p || typeof p.lang !== "string") notFound();
  const { lang } = p;

  const master = await getMasterUser();
  const needsEnSort = Boolean(master) && lang === "tr";

  const rawQuestions = await listQuestionsForLang(lang, {
    ...masterQuestionVisibility(master),
    regionSlug: "genel",
  });

  const enKeys = needsEnSort ? await fetchEnglishQuestionTranslationKeys() : null;

  const questions =
    needsEnSort && enKeys
      ? sortTurkishQuestionsWithMissingEnglishFirst(rawQuestions, enKeys)
      : rawQuestions;

  const title = lang === "tr" ? "Genel" : "General";
  const home = lang === "tr" ? "Ana sayfa" : "Home";
  const crumbs = [
    { label: home, href: `/${lang}` },
    { label: title },
  ];

  const latestLabel = lang === "tr" ? "Son içerikler" : "Latest posts";
  const noPosts =
    lang === "tr" ? "Bu sayfa için henüz içerik yok." : "No posts yet.";

  return (
    <div className="space-y-12 sm:space-y-16">
      <Breadcrumbs items={crumbs} pagePath={`/${lang}/genel`} />

      <section aria-labelledby="general-latest-heading">
        <h1 id="general-latest-heading" className="sr-only">
          {title}
        </h1>
        <RibbonHeading>{latestLabel}</RibbonHeading>
        {questions.length === 0 ? (
          <p className="text-center text-sm text-zinc-500">{noPosts}</p>
        ) : (
          <ul className="mx-auto grid w-full max-w-xl grid-cols-1 gap-8 md:max-w-none md:grid-cols-2 md:gap-8 xl:grid-cols-3">
            {questions.slice(0, 12).map((q) => (
              <li key={q.id} className="min-w-0">
                <PostCard lang={lang} question={q} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

