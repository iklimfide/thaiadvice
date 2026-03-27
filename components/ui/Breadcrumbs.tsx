import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-6 text-sm text-zinc-600"
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-zinc-400" aria-hidden>
                /
              </span>
            )}
            {c.href ? (
              <Link
                href={c.href}
                className="transition hover:text-brand hover:underline"
              >
                {c.label}
              </Link>
            ) : (
              <span className="font-medium text-zinc-900">{c.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
