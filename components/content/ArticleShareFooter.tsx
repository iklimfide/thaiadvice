"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Props = {
  shareUrl: string;
  title: string;
  lang: string;
  /** Verilirse beğeni tarayıcıda kalıcı (localStorage) */
  articleId?: string;
  className?: string;
};

function likeStorageKey(id: string) {
  return `thaiadvice-q-like-${id}`;
}

export function ArticleShareFooter({
  shareUrl,
  title,
  lang,
  articleId,
  className = "",
}: Props) {
  const tr = lang === "tr";
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!articleId || typeof window === "undefined") return;
    setLiked(localStorage.getItem(likeStorageKey(articleId)) === "1");
  }, [articleId]);

  const toggleLike = useCallback(() => {
    setLiked((prev) => {
      const next = !prev;
      if (articleId && typeof window !== "undefined") {
        const k = likeStorageKey(articleId);
        if (next) localStorage.setItem(k, "1");
        else localStorage.removeItem(k);
      }
      return next;
    });
  }, [articleId]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }, [shareUrl]);

  const enc = useMemo(
    () => ({
      u: encodeURIComponent(shareUrl),
      t: encodeURIComponent(title),
      wt: encodeURIComponent(`${title} ${shareUrl}`),
    }),
    [shareUrl, title]
  );

  const heading = tr ? "Paylaş ve beğen" : "Share & like";
  const likeLabel = tr ? "Beğen" : "Like";
  const copyLabel = tr ? "Bağlantıyı kopyala" : "Copy link";
  const copiedMsg = tr ? "Kopyalandı" : "Copied";

  return (
    <div className={`mt-10 border-t border-zinc-200 pt-6 sm:mt-12 ${className}`}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {heading}
      </h2>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          aria-pressed={liked}
          onClick={toggleLike}
          className="rounded-full p-2 text-zinc-500 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label={likeLabel}
          title={likeLabel}
        >
          <HeartIcon filled={liked} />
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-brand"
          aria-label={copyLabel}
          title={copyLabel}
        >
          <CopyIcon />
        </button>
        {copied ? (
          <span className="text-xs font-medium text-emerald-600" role="status">
            {copiedMsg}
          </span>
        ) : null}
        <a
          href={`https://wa.me/?text=${enc.wt}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-brand"
          aria-label={tr ? "WhatsApp’ta paylaş" : "Share on WhatsApp"}
          title="WhatsApp"
        >
          <WhatsAppIcon />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${enc.u}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-brand"
          aria-label={tr ? "Facebook’ta paylaş" : "Share on Facebook"}
        >
          <FacebookIcon />
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${enc.u}&text=${enc.t}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-brand"
          aria-label={tr ? "X’te paylaş" : "Share on X"}
        >
          <XIcon />
        </a>
        <a
          href={`https://pinterest.com/pin/create/button/?url=${enc.u}&description=${enc.t}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-brand"
          aria-label={tr ? "Pinterest’te paylaş" : "Share on Pinterest"}
        >
          <PinterestIcon />
        </a>
        <a
          href={`mailto:?subject=${enc.t}&body=${enc.u}`}
          className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100 hover:text-brand"
          aria-label={tr ? "E-posta ile paylaş" : "Share by email"}
        >
          <MailIcon />
        </a>
      </div>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      className={filled ? "text-rose-500" : ""}
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function PinterestIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
