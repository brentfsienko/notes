import Link from "next/link";

export function LibraryHeader({
  imageUrl,
  name,
}: {
  imageUrl?: string | null;
  name?: string | null;
}) {
  const label = name?.trim() ? `Profile (${name.trim()})` : "Profile";

  return (
    <header className="flex items-center gap-3 px-4 pt-4 pb-1">
      <Link
        href="/profile"
        className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        aria-label={label}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            width={30}
            height={30}
            className="h-[30px] w-[30px] rounded-full object-cover opacity-90"
          />
        ) : (
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-elevated">
            <svg className="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </div>
        )}
      </Link>

      <h1 className="min-w-0 flex-1 text-xl font-light tracking-wide text-fg lowercase">
        your library
      </h1>

      <Link
        href="/search"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted active:text-fg transition-colors"
        aria-label="Search"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </Link>
    </header>
  );
}
