import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { stripLeadingQuickAnswerBlockFromMarkdown } from "@/lib/format/faq-display";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

type Props = {
  markdown: string;
  className?: string;
};

/**
 * Makale / mekân gövdesi: Markdown → sanitize edilmiş HTML.
 * Sayfadaki tek h1 başlıkla çakışmaması için markdown # … ###### bir kademe aşağı (h2–h4) render edilir.
 */
const markdownComponents: Components = {
  h1: ({ node: _node, ...props }) => <h2 {...props} />,
  h2: ({ node: _node, ...props }) => <h3 {...props} />,
  h3: ({ node: _node, ...props }) => <h4 {...props} />,
  h4: ({ node: _node, ...props }) => <h4 {...props} />,
  h5: ({ node: _node, ...props }) => <h4 {...props} />,
  h6: ({ node: _node, ...props }) => <h4 {...props} />,
  a: ({ node: _node, href, children, ...props }) => {
    const external =
      typeof href === "string" &&
      (href.startsWith("http:") || href.startsWith("https:"));
    return (
      <a
        href={href}
        {...props}
        {...(external
          ? { rel: "noopener noreferrer", target: "_blank" }
          : {})}
      >
        {children}
      </a>
    );
  },
  img: ({ node: _node, src, alt, ...props }) => {
    if (!src || typeof src !== "string") return null;
    return (
      <span className="my-4 block text-center">
        {/* Markdown görselleri keyfi URL; next/image domain kısıtı yok */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? ""}
          className="mx-auto max-h-[min(70vh,560px)] max-w-full rounded-lg border border-zinc-200 object-contain"
          loading="lazy"
          decoding="async"
          {...props}
        />
      </span>
    );
  },
};

export function ArticleMarkdownBody({ markdown, className }: Props) {
  const trimmed = stripLeadingQuickAnswerBlockFromMarkdown(markdown).trim();
  if (!trimmed) return null;

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={markdownComponents}
      >
        {trimmed}
      </ReactMarkdown>
    </div>
  );
}
