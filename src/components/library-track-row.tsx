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

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
    </svg>
  );
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
        <div className="relative aspect-square w-full overflow-hidden rounded bg-elevated">
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
        <p className="mt-2 line-clamp-2 text-sm font-normal leading-snug text-fg">
          {track.name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{track.artist}</p>
        {note ? (
          <p className="mt-1 line-clamp-2 text-xs text-accent/80">{note}</p>
        ) : (
          <PencilIcon className="mt-1 h-3.5 w-3.5 text-faint" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onNoteClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left active:bg-elevated/60 transition-colors"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-elevated">
        {track.albumArt ? (
          <Image
            src={track.albumArt}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-normal text-fg">{track.name}</p>
        <p className="truncate text-sm text-muted">{track.artist}</p>
        {note ? (
          <p className="mt-0.5 line-clamp-1 text-sm text-accent/80">{note}</p>
        ) : (
          <PencilIcon className="mt-0.5 h-3.5 w-3.5 text-faint" />
        )}
      </div>
    </button>
  );
}
