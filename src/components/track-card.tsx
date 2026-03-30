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
    <div className="flex items-start gap-3 px-5 py-3.5">
      {track.albumArt ? (
        <Image
          src={track.albumArt}
          alt=""
          width={48}
          height={48}
          className="rounded-lg shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg shrink-0 mt-0.5 bg-sand" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-charcoal truncate text-[15px] leading-tight">
          {track.name}
        </p>
        <p className="text-sm text-bark truncate mt-0.5">{track.artist}</p>
        {note ? (
          <button
            onClick={onNoteClick}
            className="mt-1.5 text-sm text-sage leading-snug line-clamp-2 text-left"
          >
            {note}
          </button>
        ) : (
          <button
            onClick={onNoteClick}
            className="mt-1.5 text-sm text-stone active:text-bark transition-colors"
          >
            Add a note&hellip;
          </button>
        )}
      </div>
      {action && <div className="shrink-0 mt-1">{action}</div>}
    </div>
  );
}
