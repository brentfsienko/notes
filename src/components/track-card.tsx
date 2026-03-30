"use client";

import Image from "next/image";

interface TrackCardProps {
  track: {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
  };
  note?: string;
  onNoteClick: () => void;
  action?: React.ReactNode;
}

export function TrackCard({ track, note, onNoteClick, action }: TrackCardProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <button
        type="button"
        onClick={onNoteClick}
        className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-80"
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
            <p className="mt-0.5 text-sm text-faint">add a note\u2026</p>
          )}
        </div>
      </button>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
