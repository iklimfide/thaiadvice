"use client";

import { SafeImage } from "@/components/ui/SafeImage";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { NavQuestionCategory } from "@/lib/data/queries";
import { normalizeQuestionCategorySlug } from "@/lib/data/question-categories";
import type { RegionRow } from "@/lib/types/database";

const LANGS = [
  { code: "tr", label: "TR" },
  { code: "en", label: "EN" },
] as const;

type Props = {
  lang: string;
  regions: RegionRow[];
  navQuestionCategories: NavQuestionCategory[];
};

export function MainNav({ lang, regions, navQuestionCategories }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const destRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const activeCategoryParam =
    searchParams?.get("category")?.trim() ?? "";
  const activeCategoryCanon = activeCategoryParam.length
    ? normalizeQuestionCategorySlug(activeCategoryParam)
    : null;

  const isHome =
    pathname === `/${lang}` || pathname === `/${lang}/`;

  const corporateAboutPath = `/${lang}/genel/kurumsal/arif-guvenc-kimdir`;
  const isCorporateAboutPage = pathname === corporateAboutPath;

  const pathSegments = pathname.split("/").filter(Boolean);
  const isArticleDetail =
    pathSegments.length >= 4 && pathSegments[0] === lang;

  useEffect(() => {
    function close(e: MouseEvent) {
      const t = e.target as Node;
      if (destRef.current && !destRef.current.contains(t)) setDestOpen(false);
      if (catRef.current && !catRef.current.contains(t)) setCatOpen(false);
    }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const t = (tr: string, en: string) => (lang === "tr" ? tr : en);

  const navLinkClass = (active: boolean) =>
    `whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
      active
        ? "bg-white text-brand shadow-sm"
        : "text-white/95 hover:bg-white/15 hover:text-white"
    }`;

  const barBtnClass = (open: boolean, extra = "") =>
    `flex items-center gap-1 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wide text-white/95 transition hover:bg-white/15 hover:text-white ${open ? "bg-white/20 text-white" : ""} ${extra}`;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/15 shadow-md"
      style={{ backgroundColor: "var(--header-bar-bg)" }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          {isArticleDetail ? (
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/35 text-white hover:bg-white/10"
              onClick={() => router.back()}
              aria-label={t("Geri", "Back")}
            >
              <BackChevronIcon />
            </button>
          ) : null}
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/35 text-white hover:bg-white/10 lg:hidden"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">Menü</span>
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Link
            href={`/${lang}`}
            className="flex min-w-0 items-center gap-2 font-bold tracking-tight text-white"
          >
            <SafeImage
              src="/favicon.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-lg object-cover shadow-sm ring-2 ring-white/35"
              priority
              fallback={
                <span
                  className="h-9 w-9 shrink-0 rounded-lg bg-white/20 ring-2 ring-white/35"
                  aria-hidden
                />
              }
            />
            <span className="truncate text-base sm:text-lg drop-shadow-sm">
              ThaiAdvice.com
            </span>
          </Link>
        </div>

        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label="Ana menü"
        >
          <Link href={`/${lang}`} className={navLinkClass(isHome)}>
            {t("Ana sayfa", "Home")}
          </Link>
          <Link
            href={corporateAboutPath}
            className={navLinkClass(isCorporateAboutPage)}
          >
            {t("Arif GÜVENÇ kimdir", "About Arif GÜVENÇ")}
          </Link>
          <div className="relative" ref={destRef}>
            <button
              type="button"
              onClick={() => {
                setCatOpen(false);
                setDestOpen((v) => !v);
              }}
              className={barBtnClass(destOpen)}
            >
              {t("Destinasyonlar", "Destinations")}
              <ChevronDown className={destOpen ? "rotate-180" : ""} />
            </button>
            {destOpen ? (
              <ul className="absolute left-0 top-full z-50 mt-1 max-h-[70vh] w-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-2 shadow-lg">
                {regions.length === 0 ? (
                  <li className="px-4 py-2 text-sm text-zinc-500">
                    {t("Kayıt yok", "No regions")}
                  </li>
                ) : (
                  regions.map((r) => (
                    <li key={r.id}>
                      <Link
                        href={`/${lang}/${r.slug}`}
                        className="block px-4 py-2 text-sm text-zinc-800 hover:bg-violet-50 hover:text-brand"
                        onClick={() => setDestOpen(false)}
                      >
                        {r.name || r.slug}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
          <div className="relative" ref={catRef}>
            <button
              type="button"
              onClick={() => {
                setDestOpen(false);
                setCatOpen((v) => !v);
              }}
              className={barBtnClass(catOpen || activeCategoryCanon != null)}
            >
              {t("Kategoriler", "Categories")}
              <ChevronDown className={catOpen ? "rotate-180" : ""} />
            </button>
            {catOpen ? (
              <ul className="absolute left-0 top-full z-50 mt-1 max-h-[70vh] w-56 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-2 shadow-lg">
                <li>
                  <Link
                    href={`/${lang}#latest-posts`}
                    className={`block px-4 py-2 text-sm hover:bg-violet-50 hover:text-brand ${activeCategoryCanon == null ? "font-semibold text-brand" : "text-zinc-800"}`}
                    onClick={() => setCatOpen(false)}
                  >
                    {t("Tümü", "All")}
                  </Link>
                </li>
                {navQuestionCategories.length === 0 ? (
                  <li className="px-4 py-2 text-sm text-zinc-500">
                    {t("Kayıt yok", "No categories")}
                  </li>
                ) : (
                  navQuestionCategories.map((cat) => {
                    const active = activeCategoryCanon === cat.slug;
                    return (
                      <li key={cat.slug}>
                        <Link
                          href={`/${lang}?category=${encodeURIComponent(cat.slug)}#latest-posts`}
                          className={`block px-4 py-2 text-sm hover:bg-violet-50 hover:text-brand ${active ? "font-semibold text-brand" : "text-zinc-800"}`}
                          onClick={() => setCatOpen(false)}
                        >
                          {cat.label}
                        </Link>
                      </li>
                    );
                  })
                )}
              </ul>
            ) : null}
          </div>
          <Link href={`/${lang}#regions`} className={navLinkClass(false)}>
            {t("Bölgeler", "Regions")}
          </Link>
          <Link href={`/${lang}#oneri`} className={navLinkClass(false)}>
            {t("Öneri gönder", "Submit")}
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/25 bg-brand-dark/40 p-0.5">
          {LANGS.map(({ code, label }) => (
            <Link
              key={code}
              href={`/${code}`}
              className={`rounded-md px-2 py-1 text-xs font-bold ${
                lang === code
                  ? "bg-white text-brand shadow-sm"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {mobileOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-hidden
            onClick={() => setMobileOpen(false)}
          />
          <div
            id="mobile-menu"
            className="fixed inset-y-0 left-0 z-50 w-[min(100%,18rem)] overflow-y-auto border-r border-zinc-200 bg-white shadow-xl lg:hidden"
          >
            <div className="border-b border-zinc-100 p-4">
              <p className="text-xs font-bold uppercase text-zinc-500">
                {t("Menü", "Menu")}
              </p>
            </div>
            <nav className="flex flex-col p-2">
              <Link
                href={`/${lang}`}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-zinc-800 hover:bg-violet-50"
                onClick={() => setMobileOpen(false)}
              >
                {t("Ana sayfa", "Home")}
              </Link>
              <Link
                href={corporateAboutPath}
                className={`rounded-lg px-3 py-3 text-sm font-semibold hover:bg-violet-50 ${isCorporateAboutPage ? "text-brand" : "text-zinc-800"}`}
                onClick={() => setMobileOpen(false)}
              >
                {t("Arif GÜVENÇ kimdir", "About Arif GÜVENÇ")}
              </Link>
              <p className="px-3 pt-2 text-xs font-bold uppercase text-zinc-500">
                {t("Destinasyonlar", "Destinations")}
              </p>
              {regions.map((r) => (
                <Link
                  key={r.id}
                  href={`/${lang}/${r.slug}`}
                  className="rounded-lg px-3 py-2.5 pl-5 text-sm text-zinc-700 hover:bg-violet-50"
                  onClick={() => setMobileOpen(false)}
                >
                  {r.name || r.slug}
                </Link>
              ))}
              <p className="px-3 pt-3 text-xs font-bold uppercase text-zinc-500">
                {t("Kategoriler", "Categories")}
              </p>
              <Link
                href={`/${lang}#latest-posts`}
                className={`rounded-lg px-3 py-2.5 pl-5 text-sm hover:bg-violet-50 ${activeCategoryCanon == null ? "font-semibold text-brand" : "text-zinc-700"}`}
                onClick={() => setMobileOpen(false)}
              >
                {t("Tümü", "All")}
              </Link>
              {navQuestionCategories.map((cat) => {
                const active = activeCategoryCanon === cat.slug;
                return (
                  <Link
                    key={cat.slug}
                    href={`/${lang}?category=${encodeURIComponent(cat.slug)}#latest-posts`}
                    className={`rounded-lg px-3 py-2.5 pl-5 text-sm hover:bg-violet-50 ${active ? "font-semibold text-brand" : "text-zinc-700"}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.label}
                  </Link>
                );
              })}
              <Link
                href={`/${lang}#regions`}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-zinc-800 hover:bg-violet-50"
                onClick={() => setMobileOpen(false)}
              >
                {t("Bölgeler", "Regions")}
              </Link>
              <Link
                href={`/${lang}#oneri`}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-zinc-800 hover:bg-violet-50"
                onClick={() => setMobileOpen(false)}
              >
                {t("Öneri gönder", "Submit")}
              </Link>
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}

function BackChevronIcon() {
  return (
    <svg
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 transition ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
