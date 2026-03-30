"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LibraryTrackRow } from "./library-track-row";
import { NoteEditor } from "./note-editor";
import { fetchSavedTracks } from "@/app/actions/spotify";
import { getNotes, upsertNote, deleteNote } from "@/app/actions/notes";

interface TrackWithNote {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  note: string;
  addedAt: string;
}

export function LibraryContent() {
  const [tracks, setTracks] = useState<TrackWithNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [editingTrack, setEditingTrack] = useState<TrackWithNote | null>(null);
  const [search, setSearch] = useState("");

  const loadTracks = useCallback(async (currentOffset: number) => {
    const isInitial = currentOffset === 0;
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const data = await fetchSavedTracks(currentOffset);
      const items = data.items ?? [];

      const trackIds = items.map(
        (item: { track: { id: string } }) => item.track.id,
      );
      const notes = await getNotes(trackIds);
      const noteMap = new Map(
        notes.map((n: { spotifyTrackId: string; body: string }) => [
          n.spotifyTrackId,
          n.body,
        ]),
      );

      const newTracks: TrackWithNote[] = items.map(
        (item: {
          added_at?: string;
          track: {
            id: string;
            name: string;
            artists: Array<{ name: string }>;
            album: { images: Array<{ url: string }> };
          };
        }) => {
          const images = item.track.album.images;
          return {
            id: item.track.id,
            name: item.track.name,
            artist: item.track.artists.map((a) => a.name).join(", "),
            albumArt: images[images.length > 1 ? 1 : 0]?.url ?? "",
            note: (noteMap.get(item.track.id) as string) ?? "",
            addedAt: item.added_at ?? "",
          };
        },
      );

      setTracks((prev) => (isInitial ? newTracks : [...prev, ...newTracks]));
      setHasMore(data.next !== null);
      setOffset(currentOffset + items.length);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

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
      <div className="flex flex-col gap-1 px-2 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2.5 animate-pulse">
            <div className="h-14 w-14 shrink-0 rounded-md bg-chip" />
            <div className="flex-1 space-y-2">
              <div className="h-4 rounded bg-chip w-3/4" />
              <div className="h-3 rounded bg-chip w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <p className="text-base font-medium text-fg">Nothing here yet</p>
        <p className="mt-2 text-sm text-muted">
          Save songs in Spotify or open Search to find more.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-bg px-4 pb-2 pt-2">
        <div className="relative">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find in your library"
            className="w-full rounded-lg bg-chip py-2.5 pl-9 pr-4 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-fg/20"
          />
        </div>
      </div>

      {visibleTracks.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">
          No songs match &ldquo;{search}&rdquo;
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
            className="rounded-full bg-chip px-6 py-2.5 text-sm font-medium text-fg active:bg-elevated disabled:opacity-50"
          >
            {loadingMore ? "Loading\u2026" : "Load more"}
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
