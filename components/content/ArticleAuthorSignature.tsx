import Link from "next/link";

type Props = {
  lang: string;
};

/**
 * Makale sonu: yazar özeti + kurumsal “kimdir” bağlantısı.
 */
export function ArticleAuthorSignature({ lang }: Props) {
  const tr = lang === "tr";
  const href = `/${lang}/genel/kurumsal/arif-guvenc-kimdir`;

  return (
    <aside
      className="mt-8 rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50/95 via-white to-brand/[0.04] p-5 shadow-sm ring-1 ring-zinc-100/80 sm:mt-10 sm:p-7"
      aria-labelledby="article-author-signature-heading"
    >
      <h2
        id="article-author-signature-heading"
        className="font-serif text-lg font-bold tracking-tight text-zinc-900 sm:text-xl"
      >
        {tr ? "Yazar: Arif GÜVENÇ" : "Author: Arif GÜVENÇ"}
      </h2>
      <p className="mt-3 text-justify text-base leading-[1.75] text-zinc-700 sm:text-[1.0625rem] sm:leading-[1.8]">
        {tr ? (
          <>
            27 yıllık Ziraat Mühendisi disipliniyle dünyayı bir stratejist gözüyle
            analiz eden Arif GÜVENÇ, seyahati bir keşiften öte &quot;yaşamı çözümleme
            süreci&quot; olarak görür. Tayland&apos;ın karmaşık dokusunu analitik bir
            zeka ve babalık şefkatiyle rehbere dönüştüren Güvenç, tecrübelerini bir
            bilgi mirası olarak paylaşıyor.
          </>
        ) : (
          <>
            With twenty-seven years of rigour as an agricultural engineer, Arif
            GÜVENÇ reads the world through a strategist&apos;s eye and treats travel
            as more than discovery—a way to make sense of life. He turns
            Thailand&apos;s layered reality into practical guidance with analytical
            clarity and a father&apos;s care, sharing his experience as a living
            body of knowledge.
          </>
        )}
      </p>
      <p className="mt-5">
        <Link
          href={href}
          className="inline-flex flex-wrap items-center gap-2 font-semibold text-brand underline decoration-brand/50 underline-offset-[3px] transition hover:text-violet-700 hover:decoration-violet-600"
        >
          <span aria-hidden className="select-none">
            👉
          </span>
          <span>
            {tr
              ? "Arif GÜVENÇ Kimdir? Tüm Hikayeyi Okuyun"
              : "Who is Arif GÜVENÇ? Read the full story"}
          </span>
        </Link>
      </p>
    </aside>
  );
}
