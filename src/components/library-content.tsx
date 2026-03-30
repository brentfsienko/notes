"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { LibraryTrackRow } from "./library-track-row";
import { NoteEditor } from "./note-editor";
import { fetchSavedTracks } from "@/app/actions/spotify";
import { getNotes, upsertNote, deleteNote } from "@/app/actions/notes";

type FilterId = "all" | "notes" | "none";
type SortId = "recent" | "title";

interface TrackWithNote {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  note: string;
  addedAt: string;
}

const CHIPS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Songs" },
  { id: "notes", label: "With notes" },
  { id: "none", label: "No note" },
];

export function LibraryContent() {
  const [tracks, setTracks] = useState<TrackWithNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [editingTrack, setEditingTrack] = useState<TrackWithNote | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");
  const [sort, setSort] = useState<SortId>("recent");
  const [grid, setGrid] = useState(false);

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
    let t = tracks;
    if (filter === "notes") t = t.filter((x) => x.note.trim());
    if (filter === "none") t = t.filter((x) => !x.note.trim());
    const sorted = [...t].sort((a, b) => {
      if (sort === "title") return a.name.localeCompare(b.name);
      const ta = a.addedAt ? new Date(a.addedAt).getTime() : 0;
      const tb = b.addedAt ? new Date(b.addedAt).getTime() : 0;
      return tb - ta;
    });
    return sorted;
  }, [tracks, filter, sort]);

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
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-2 pt-2">
        <button
          type="button"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chip text-fg"
          aria-label="Filters"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.125 1.125 0 1 1-2.25 0m2.25 0a1.125 1.125 0 1 0-2.25 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.125 1.125 0 1 0-2.25 0m2.25 0a1.125 1.125 0 1 1-2.25 0m-2.25 0H7.5m9-6h3.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H18.75a1.125 1.125 0 0 1-1.125-1.125v-9.75c0-.621.504-1.125 1.125-1.125Z" />
          </svg>
        </button>
        {CHIPS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === c.id
                ? "bg-spotify-green text-bg"
                : "bg-chip text-fg"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-2">
        <button
          type="button"
          onClick={() => setSort((s) => (s === "recent" ? "title" : "recent"))}
          className="flex items-center gap-2 text-sm font-medium text-fg"
        >
          <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
          </svg>
          {sort === "recent" ? "Recents" : "A–Z"}
        </button>
        <button
          type="button"
          onClick={() => setGrid((g) => !g)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-fg active:bg-chip"
          aria-label={grid ? "List view" : "Grid view"}
        >
          {grid ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
          )}
        </button>
      </div>

      {visibleTracks.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted">No songs match this filter.</p>
      ) : grid ? (
        <div className="grid grid-cols-2 gap-4 px-4 pb-4">
          {visibleTracks.map((track) => (
            <LibraryTrackRow
              key={track.id}
              track={track}
              note={track.note}
              onNoteClick={() => setEditingTrack(track)}
              variant="grid"
            />
          ))}
        </div>
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
            {loadingMore ? "Loading…" : "Load more"}
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
