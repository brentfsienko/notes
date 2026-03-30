"use client";

export default function LibraryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-fg">something went wrong</p>
      <p className="mt-2 max-w-xs text-xs text-muted break-all">{error.message}</p>
      {error.digest && (
        <p className="mt-1 text-xs text-faint">digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 rounded-lg border border-border px-5 py-2 text-sm text-fg active:bg-elevated transition-colors"
      >
        try again
      </button>
      <a href="/auth/signout" className="mt-3 text-sm text-accent">
        sign out &amp; start fresh
      </a>
    </div>
  );
}
