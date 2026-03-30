import Link from "next/link";

export function HeaderProfileLink({
  imageUrl,
  name,
}: {
  imageUrl?: string | null;
  name?: string | null;
}) {
  const label = name?.trim() ? `Profile (${name.trim()})` : "Profile";

  return (
    <Link
      href="/profile"
      className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      aria-label={label}
    >
      {imageUrl ? (
        /* Spotify avatars use various CDNs; avoid next/image domain allowlist */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
          width={36}
          height={36}
        />
      ) : (
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-elevated ring-1 ring-border"
          aria-hidden
        >
          <svg
            className="h-4 w-4 text-faint"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </svg>
        </div>
      )}
    </Link>
  );
}
