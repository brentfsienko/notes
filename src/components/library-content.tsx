"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchUserPlaylists, fetchSavedTracksTotal } from "@/app/actions/spotify";

interface Playlist {
  id: string;
  name: string;
  owner: { display_name: string };
  images: Array<{ url: string }>;
  tracks: { total: number };
}

export function LibraryContent() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTotal, setLikedTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [playlistData, total] = await Promise.all([
        fetchUserPlaylists(0, 50),
        fetchSavedTracksTotal(),
      ]);
      setPlaylists(
        (playlistData.items ?? []).filter(
          (p: Playlist) => p && p.id && p.name,
        ),
      );
      setLikedTotal(total);
    } catch (e) {
      console.error("Failed to load library:", e);
      const msg = e instanceof Error ? e.message : String(e);
      setError(`couldn't load your library: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return playlists;
    const q = search.toLowerCase();
    return playlists.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.owner.display_name.toLowerCase().includes(q),
    );
  }, [playlists, search]);

  const showLiked = !search.trim() || "liked songs".includes(search.toLowerCase());

  if (loading) {
    return (
      <div className="flex flex-col gap-1 px-3 pt-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-1 py-3 animate-pulse">
            <div className="h-12 w-12 shrink-0 rounded bg-elevated" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 rounded bg-elevated w-3/4" />
              <div className="h-3 rounded bg-elevated w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-sm text-muted">{error}</p>
        <button
          onClick={load}
          className="mt-4 rounded-lg border border-border px-5 py-2 text-sm text-fg active:bg-elevated transition-colors"
        >
          retry
        </button>
        <Link href="/auth/signout" className="mt-3 text-sm text-accent">
          sign out
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-bg px-4 pb-2 pt-2">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="find in your library"
            className="w-full rounded-lg bg-elevated py-2.5 pl-9 pr-4 text-sm text-fg placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
      </div>

      <div className="flex flex-col pb-4">
        {showLiked && (
          <Link
            href="/library/liked"
            className="flex items-center gap-3 px-4 py-2.5 active:bg-elevated/60 transition-colors"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded bg-gradient-to-br from-accent/60 to-accent/20">
              <svg className="h-5 w-5 text-fg" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-normal text-fg">liked songs</p>
              <p className="truncate text-sm text-muted">
                {likedTotal !== null ? `${likedTotal} songs` : "playlist"}
              </p>
            </div>
            <svg className="h-4 w-4 shrink-0 text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        )}

        {filtered.map((playlist) => (
          <Link
            key={playlist.id}
            href={`/playlist/${playlist.id}`}
            className="flex items-center gap-3 px-4 py-2.5 active:bg-elevated/60 transition-colors"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-elevated">
              {playlist.images?.[0]?.url ? (
                <Image
                  src={playlist.images[0].url}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <svg className="h-5 w-5 text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-normal text-fg">{playlist.name}</p>
              <p className="truncate text-sm text-muted">
                {playlist.owner?.display_name ?? "playlist"} {"\u00B7"} {playlist.tracks?.total ?? 0} songs
              </p>
            </div>
            <svg className="h-4 w-4 shrink-0 text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        ))}

        {!showLiked && filtered.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted">
            {`no results for \u201C${search}\u201D`}
          </p>
        )}
      </div>
    </>
  );
}
