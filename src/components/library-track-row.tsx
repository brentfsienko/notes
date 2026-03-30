"use client";

import Image from "next/image";

interface LibraryTrackRowProps {
  track: {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
  };
  note?: string;
  onNoteClick: () => void;
  variant?: "list" | "grid";
}

export function LibraryTrackRow({
  track,
  note,
  onNoteClick,
  variant = "list",
}: LibraryTrackRowProps) {
  if (variant === "grid") {
    return (
      <button
        type="button"
        onClick={onNoteClick}
        className="flex w-full flex-col text-left active:opacity-80"
      >
        <div className="relative aspect-square w-full overflow-hidden rounded-md bg-elevated">
          {track.albumArt ? (
            <Image
              src={track.albumArt}
              alt=""
              fill
              sizes="(max-width: 512px) 45vw, 240px"
              className="object-cover"
            />
          ) : null}
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-fg">
          {track.name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{track.artist}</p>
        {note ? (
          <p className="mt-1 line-clamp-2 text-xs text-spotify-green">{note}</p>
        ) : (
          <p className="mt-1 text-xs text-faint">Tap to add note</p>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onNoteClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-elevated/80"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-elevated">
        {track.albumArt ? (
          <Image
            src={track.albumArt}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-fg">{track.name}</p>
        <p className="truncate text-sm text-muted">Song · {track.artist}</p>
        {note ? (
          <p className="mt-0.5 line-clamp-1 text-sm text-spotify-green">{note}</p>
        ) : (
          <p className="mt-0.5 text-sm text-faint">Add a note…</p>
        )}
      </div>
    </button>
  );
}
