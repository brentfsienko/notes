import Link from "next/link";

export function CollectionHeader({
  title,
  backHref,
  subtitle,
}: {
  title: string;
  backHref: string;
  /** e.g. track count for a playlist */
  subtitle?: string | null;
}) {
  return (
    <header className="flex items-start gap-2 px-2 pt-3 pb-1">
      <Link
        href={backHref}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted active:text-fg transition-colors"
        aria-label="Back"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
      </Link>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold tracking-wide text-fg lowercase">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 truncate text-sm text-muted lowercase">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
