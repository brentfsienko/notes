"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { LibraryTrackRow } from "./library-track-row";
import { NoteEditor } from "./note-editor";
import { fetchPlaylistTracks, saveSpotifyTrack } from "@/app/actions/spotify";
import { getNotes, upsertNote, deleteNote } from "@/app/actions/notes";

interface TrackWithNote {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  note: string;
  addedAt: string;
}

export function PlaylistContent({
  playlistId,
  reportedTrackTotal,
}: {
  playlistId: string;
  /** From Spotify playlist metadata (`tracks.total`) when the server can read it. */
  reportedTrackTotal?: number | null;
}) {
  const [tracks, setTracks] = useState<TrackWithNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [editingTrack, setEditingTrack] = useState<TrackWithNote | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadTracks = useCallback(
    async (currentOffset: number) => {
      const isInitial = currentOffset === 0;
      if (isInitial) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const data = await fetchPlaylistTracks(playlistId, currentOffset);
        const items = (data.items ?? []).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (row: any) => {
            const t = row?.track ?? row?.item;
            return (
              t?.id &&
              (t.type === undefined || t.type === "track")
            );
          },
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const trackIds = items.map((item: any) => (item.track ?? item.item).id as string);
        const notes = await getNotes(trackIds);
        const noteMap = new Map(
          notes.map((n: { spotifyTrackId: string; body: string }) => [
            n.spotifyTrackId,
            n.body,
          ]),
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newTracks: TrackWithNote[] = items.map((item: any) => {
          const t = item.track ?? item.item;
          const images = t.album?.images ?? [];
          return {
            id: t.id,
            name: t.name ?? "unknown",
            artist: (t.artists ?? []).map((a: { name: string }) => a.name).join(", ") || "unknown",
            albumArt: images[images.length > 1 ? 1 : 0]?.url ?? "",
            note: (noteMap.get(t.id) as string) ?? "",
            addedAt: item.added_at ?? "",
          };
        });

        setTracks((prev) => (isInitial ? newTracks : [...prev, ...newTracks]));
        setHasMore(data.next !== null);
        setOffset(currentOffset + items.length);
      } catch (e) {
        console.error("Failed to load playlist tracks:", e);
        const msg = e instanceof Error ? e.message : String(e);
        if (isInitial) {
          if (msg.includes("403")) {
            setError(
              "spotify returned forbidden (often fixed by signing out and connecting again, or this playlist is restricted).",
            );
          } else if (msg.includes("playlist access missing")) {
            setError(msg);
          } else {
            setError(`couldn't load this playlist: ${msg}`);
          }
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [playlistId],
  );

  useEffect(() => {
    loadTracks(0);
  }, [loadTracks]);

  const visibleTracks = useMemo(() => {
    if (!search.trim()) return tracks;
    const q = search.toLowerCase();
    return tracks.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.note.toLowerCase().includes(q),
    );
  }, [tracks, search]);

  async function handleSaveNote(body: string) {
    if (!editingTrack) return;
    await saveSpotifyTrack(editingTrack.id);
    await upsertNote(editingTrack.id, body);
    setTracks((prev) =>
      prev.map((t) => (t.id === editingTrack.id ? { ...t, note: body } : t)),
    );
  }

  async function handleDeleteNote() {
    if (!editingTrack) return;
    await deleteNote(editingTrack.id);
    setTracks((prev) =>
      prev.map((t) => (t.id === editingTrack.id ? { ...t, note: "" } : t)),
    );
  }

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
          onClick={() => loadTracks(0)}
          className="mt-4 rounded-lg border border-border px-5 py-2 text-sm text-fg active:bg-elevated transition-colors"
        >
          retry
        </button>
        <Link href="/auth/signout" className="mt-3 text-sm text-accent">
          sign out &amp; reconnect
        </Link>
      </div>
    );
  }

  if (tracks.length === 0) {
    const spotifyPlaylistUrl = `https://open.spotify.com/playlist/${encodeURIComponent(playlistId)}`;
    const likelyApiBlock =
      typeof reportedTrackTotal === "number" && reportedTrackTotal > 0;

    return (
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        {likelyApiBlock ? (
          <>
            <p className="text-sm text-fg">
              spotify isn&apos;t returning songs to this app for this playlist (web api restriction or dev app limits), even though it has songs in spotify.
            </p>
            <p className="mt-2 text-xs text-muted">
              your route <span className="break-all text-faint">/playlist/{playlistId}</span> loads fine — the block is on spotify&apos;s side when listing tracks.
            </p>
            <a
              href={spotifyPlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 rounded-lg border border-border px-5 py-2.5 text-sm text-accent active:bg-elevated transition-colors"
            >
              open in spotify
            </a>
            <p className="mt-4 max-w-sm text-xs text-muted">
              if this never resolves, check the spotify developer dashboard: development mode / quota extension, and try removing the app from your spotify account then reconnecting.
            </p>
          </>
        ) : (
          <p className="text-sm text-fg">this playlist is empty</p>
        )}
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
            placeholder="find in this playlist"
            className="w-full rounded-lg bg-elevated py-2.5 pl-9 pr-4 text-sm text-fg placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
        </div>
      </div>

      {visibleTracks.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">
          {`no songs match \u201C${search}\u201D`}
        </p>
      ) : (
        <div className="flex flex-col pb-4">
          {visibleTracks.map((track) => (
            <LibraryTrackRow
              key={track.id}
              track={track}
              note={track.note}
              onNoteClick={() => setEditingTrack(track)}
              variant="list"
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pb-8 pt-2">
          <button
            onClick={() => loadTracks(offset)}
            disabled={loadingMore}
            className="rounded-lg border border-border px-6 py-2.5 text-sm text-muted active:bg-elevated disabled:opacity-50 transition-colors"
          >
            {loadingMore ? "loading\u2026" : "load more"}
          </button>
        </div>
      )}

      <NoteEditor
        open={!!editingTrack}
        onOpenChange={(open) => {
          if (!open) setEditingTrack(null);
        }}
        track={editingTrack ?? { id: "", name: "", artist: "", albumArt: "" }}
        initialNote={editingTrack?.note ?? ""}
        onSave={handleSaveNote}
        onDelete={editingTrack?.note ? handleDeleteNote : undefined}
      />
    </>
  );
}
