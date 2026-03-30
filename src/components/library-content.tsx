"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { fetchUserPlaylists, fetchSavedTracksTotal } from "@/app/actions/spotify";

interface Playlist {
  id: string;
  name: string;
  owner?: { id?: string; display_name?: string };
  collaborative?: boolean;
  images: Array<{ url: string }>;
  tracks?: { total: number };
}

type SortKey = "recent" | "name-asc" | "name-desc" | "owner";
type ViewMode = "list" | "grid";

const SORT_STORAGE = "oto-library-sort";
const VIEW_STORAGE = "oto-library-view";

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
    </svg>
  );
}

function playlistMetaLine(playlist: Playlist, mySpotifyId: string | undefined) {
  const n = playlist.tracks?.total ?? 0;
  const ownerLabel = playlist.owner?.display_name ?? "playlist";
  const mine = mySpotifyId && playlist.owner?.id === mySpotifyId;
  const parts: string[] = [];
  if (playlist.collaborative) parts.push("collaborative");
  if (mine) parts.push("yours");
  else if (playlist.owner?.id) parts.push(`by ${ownerLabel}`);
  else parts.push(ownerLabel);
  return `${parts.join(" · ")} · ${n} songs`;
}

export function LibraryContent() {
  const { data: session } = useSession();
  const mySpotifyId = session?.spotifyId;

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTotal, setLikedTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  useEffect(() => {
    try {
      const s = localStorage.getItem(SORT_STORAGE);
      if (s === "recent" || s === "name-asc" || s === "name-desc" || s === "owner") {
        setSortBy(s);
      }
      const v = localStorage.getItem(VIEW_STORAGE);
      if (v === "list" || v === "grid") setViewMode(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SORT_STORAGE, sortBy);
    } catch {
      /* ignore */
    }
  }, [sortBy]);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE, viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const total = await fetchSavedTracksTotal();
      const merged: Playlist[] = [];
      let offset = 0;
      for (;;) {
        const playlistData = await fetchUserPlaylists(offset, 50);
        const items = (playlistData.items ?? []).filter(
          (p: Playlist) => p && p.id && p.name,
        ) as Playlist[];
        merged.push(...items);
        if (!playlistData.next) break;
        offset += 50;
      }
      setPlaylists(merged);
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
        (p.owner?.display_name ?? "").toLowerCase().includes(q),
    );
  }, [playlists, search]);

  const sortedPlaylists = useMemo(() => {
    if (sortBy === "recent") return filtered;
    const arr = [...filtered];
    const owner = (p: Playlist) => (p.owner?.display_name ?? "").toLowerCase();
    switch (sortBy) {
      case "name-asc":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      case "owner":
        return arr.sort((a, b) => owner(a).localeCompare(owner(b)) || a.name.localeCompare(b.name));
      default:
        return arr;
    }
  }, [filtered, sortBy]);

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
        <div className="mt-2 flex items-center gap-2">
          <label className="sr-only" htmlFor="library-sort">
            sort playlists
          </label>
          <select
            id="library-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="min-w-0 flex-1 rounded-lg border border-border bg-elevated py-2 pl-3 pr-8 text-xs lowercase text-fg focus:outline-none focus:ring-1 focus:ring-accent/30"
          >
            <option value="recent">recent (spotify order)</option>
            <option value="name-asc">name (a–z)</option>
            <option value="name-desc">name (z–a)</option>
            <option value="owner">creator</option>
          </select>
          <div className="flex shrink-0 rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md p-2 transition-colors ${viewMode === "list" ? "bg-chip text-fg" : "text-faint"}`}
              aria-label="list view"
              aria-pressed={viewMode === "list"}
            >
              <ListIcon className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-2 transition-colors ${viewMode === "grid" ? "bg-chip text-fg" : "text-faint"}`}
              aria-label="grid view"
              aria-pressed={viewMode === "grid"}
            >
              <GridIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col pb-4">
        {showLiked && viewMode === "list" && (
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

        {showLiked && viewMode === "grid" && (
          <div className="px-4 pb-2">
            <Link
              href="/library/liked"
              className="flex flex-col gap-2 rounded-lg p-1 active:bg-elevated/60 transition-colors"
            >
              <div className="relative aspect-square w-full overflow-hidden rounded bg-gradient-to-br from-accent/60 to-accent/20">
                <div className="flex h-full w-full items-center justify-center">
                  <svg className="h-10 w-10 text-fg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0 px-0.5">
                <p className="truncate text-sm font-normal text-fg">liked songs</p>
                <p className="truncate text-xs text-muted">
                  {likedTotal !== null ? `${likedTotal} songs` : "playlist"}
                </p>
              </div>
            </Link>
          </div>
        )}

        {viewMode === "list" ? (
          sortedPlaylists.map((playlist) => (
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
                <p className="truncate text-sm text-muted">{playlistMetaLine(playlist, mySpotifyId)}</p>
              </div>
              <svg className="h-4 w-4 shrink-0 text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          ))
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 px-4">
            {sortedPlaylists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlist/${playlist.id}`}
                className="flex min-w-0 flex-col gap-2 rounded-lg p-1 active:bg-elevated/60 transition-colors"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded bg-elevated">
                  {playlist.images?.[0]?.url ? (
                    <Image
                      src={playlist.images[0].url}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 50vw, 160px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg className="h-10 w-10 text-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 9 10.5-3m0 6.553v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 1 1-.99-3.467l2.31-.66a2.25 2.25 0 0 0 1.632-2.163Zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 0 1-1.632 2.163l-1.32.377a1.803 1.803 0 0 1-.99-3.467l2.31-.66A2.25 2.25 0 0 0 9 15.553Z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 px-0.5">
                  <p className="line-clamp-2 text-sm font-normal text-fg">{playlist.name}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted">{playlistMetaLine(playlist, mySpotifyId)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!showLiked && filtered.length === 0 && search.trim() && (
          <p className="px-4 py-8 text-center text-sm text-muted">
            {`no results for \u201C${search}\u201D`}
          </p>
        )}
      </div>
    </>
  );
}
