"use client";

/**
 * Visual chrome matching Spotify’s mini-player strip (no Web Playback SDK).
 */
export function MiniPlayer() {
  return (
    <div className="border-t border-border bg-mini-bg px-3 pt-2 pb-2">
      <div className="flex items-center gap-3 rounded-md px-1 py-1.5">
        <div className="h-12 w-12 shrink-0 rounded bg-elevated" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">Listen on Spotify</p>
          <p className="truncate text-xs text-muted">Open the app to play your library</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pr-1">
          <span className="flex h-8 w-8 items-center justify-center text-spotify-green" aria-hidden>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm-1 5.5v11l8-5.5-8-5.5z" />
            </svg>
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-fg" aria-hidden>
            <svg className="ml-0.5 h-3.5 w-3.5 text-bg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
