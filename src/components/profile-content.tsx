"use client";

import { useState, useEffect } from "react";
import { fetchSpotifyProfile, fetchSavedTracksTotal } from "@/app/actions/spotify";
import { countNotes } from "@/app/actions/notes";

export function ProfileContent() {
  const [profile, setProfile] = useState<{
    display_name: string;
    images: Array<{ url: string }>;
  } | null>(null);
  const [noteCount, setNoteCount] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [prof, notes, saved] = await Promise.all([
          fetchSpotifyProfile(),
          countNotes(),
          fetchSavedTracksTotal(),
        ]);
        setProfile(prof);
        setNoteCount(notes);
        setSavedCount(saved);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 pt-10 animate-pulse">
        <div className="w-20 h-20 rounded-full bg-elevated" />
        <div className="h-4 bg-elevated rounded w-32" />
        <div className="flex gap-8 mt-4">
          <div className="h-12 bg-elevated rounded w-20" />
          <div className="h-12 bg-elevated rounded w-20" />
        </div>
      </div>
    );
  }

  const avatar = profile?.images?.[0]?.url;

  return (
    <div className="flex flex-col items-center px-5 pt-10">
      {avatar ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={avatar}
          alt=""
          className="w-20 h-20 rounded-full object-cover opacity-90"
        />
      ) : (
        <div className="w-20 h-20 rounded-full bg-elevated flex items-center justify-center">
          <svg className="w-8 h-8 text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
      )}

      <h2 className="text-lg font-light text-fg mt-4 tracking-wide">
        {profile?.display_name ?? "listener"}
      </h2>

      <div className="flex gap-12 mt-8">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-light text-fg tabular-nums">
            {savedCount ?? "\u2014"}
          </span>
          <span className="text-xs text-muted mt-1">saved</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-light text-fg tabular-nums">
            {noteCount ?? "\u2014"}
          </span>
          <span className="text-xs text-muted mt-1">notes</span>
        </div>
      </div>
    </div>
  );
}
