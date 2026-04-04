import React, { isValidElement } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { ExpandableImage } from "@/components/ui/ExpandableImage";
import { normalizeArticleBodyMarkdown } from "@/lib/format/article-markdown-normalize";
import { stripLeadingQuickAnswerBlockFromMarkdown } from "@/lib/format/faq-display";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

function textFromNodes(children: React.ReactNode): string {
  if (children == null || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number")
    return String(children);
  if (Array.isArray(children))
    return children.map((c) => textFromNodes(c)).join("");
  if (isValidElement(children) && children.props && "children" in children.props) {
    return textFromNodes(
      (children.props as { children?: React.ReactNode }).children
    );
  }
  return "";
}

type BodyProps = {
  markdown: string;
  className?: string;
};

type ExcerptProps = {
  markdown: string;
  className?: string;
};

/**
 * Makale / mekân gövdesi: Markdown → sanitize edilmiş HTML.
 * Sayfadaki tek h1 başlıkla çakışmaması için markdown # … ###### bir kademe aşağı (h2–h4) render edilir.
 */
const markdownComponents: Components = {
  h1: ({ node: _node, ...props }) => <h2 {...props} />,
  h2: ({ node: _node, children, className, ...props }) => {
    const label = textFromNodes(children);
    const expertTip = /arif\s*g[uü]ven[cç]/i.test(label);
    return (
      <h3
        {...props}
        className={[className, expertTip ? "article-expert-tip-heading" : ""]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </h3>
    );
  },
  h3: ({ node: _node, ...props }) => <h4 {...props} />,
  h4: ({ node: _node, ...props }) => <h4 {...props} />,
  h5: ({ node: _node, ...props }) => <h4 {...props} />,
  h6: ({ node: _node, ...props }) => <h4 {...props} />,
  a: ({ node: _node, href, children, className, ...props }) => {
    const external =
      typeof href === "string" &&
      (href.startsWith("http:") || href.startsWith("https:"));
    const linkClass = [
      "article-detail-link",
      "font-medium text-blue-600 visited:text-blue-600 hover:text-blue-700",
      "underline decoration-blue-500/80 underline-offset-[3px] hover:decoration-blue-600",
      className,
    ]
      .filter(Boolean)
      .join(" ");
    return (
      <a
        href={href}
        className={linkClass}
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
    const altText = alt ?? "";
    return (
      <span className="my-4 block text-center">
        <ExpandableImage src={src} alt={altText}>
          {/* Markdown görselleri keyfi URL; next/image domain kısıtı yok */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={altText}
            className="mx-auto max-h-[min(70vh,560px)] max-w-full rounded-lg border border-zinc-200 object-contain transition group-hover:opacity-95"
            loading="lazy"
            decoding="async"
            {...props}
          />
        </ExpandableImage>
      </span>
    );
  },
};

const excerptMarkdownComponents: Components = {
  ...markdownComponents,
  p: ({ node: _node, className, ...props }) => (
    <p
      className={[
        "article-detail-excerpt text-pretty text-justify text-lg leading-relaxed text-zinc-700",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
};

/**
 * Özet (excerpt / snippet): markdown + site içi linkler, gövdeyle aynı `a` stili.
 */
export function ArticleMarkdownExcerpt({ markdown, className }: ExcerptProps) {
  const trimmed = normalizeArticleBodyMarkdown(
    stripLeadingQuickAnswerBlockFromMarkdown(markdown).trim()
  );
  if (!trimmed) return null;

  return (
    <div className={className} data-article-template="excerpt">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSanitize]}
        components={excerptMarkdownComponents}
      >
        {trimmed}
      </ReactMarkdown>
    </div>
  );
}

export function ArticleMarkdownBody({ markdown, className }: BodyProps) {
  const trimmed = normalizeArticleBodyMarkdown(
    stripLeadingQuickAnswerBlockFromMarkdown(markdown).trim()
  );
  if (!trimmed) return null;

  return (
    <div className={className} data-article-template="detail">
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
