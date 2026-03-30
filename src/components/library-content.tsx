"use client";

import { useState, useEffect, useCallback } from "react";
import { TrackCard } from "./track-card";
import { NoteEditor } from "./note-editor";
import { fetchSavedTracks } from "@/app/actions/spotify";
import { getNotes, upsertNote, deleteNote } from "@/app/actions/notes";

interface TrackWithNote {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  note: string;
}

export function LibraryContent() {
  const [tracks, setTracks] = useState<TrackWithNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [editingTrack, setEditingTrack] = useState<TrackWithNote | null>(null);

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
      <div className="flex flex-col gap-1 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
            <div className="w-12 h-12 rounded-lg bg-sand/60" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-sand/60 rounded w-3/4" />
              <div className="h-3 bg-sand/60 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
        <p className="text-bark text-[15px]">Your library is empty.</p>
        <p className="text-stone text-sm mt-1">
          Save songs from Spotify or use the search tab.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col divide-y divide-sand/50">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            note={track.note}
            onNoteClick={() => setEditingTrack(track)}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={() => loadTracks(offset)}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-xl border border-sand text-bark text-sm font-medium active:bg-sand/30 transition-colors disabled:opacity-50"
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
