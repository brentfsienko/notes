"use client";

import { useState, useCallback } from "react";
import { TrackCard } from "./track-card";
import { NoteEditor } from "./note-editor";
import {
  searchSpotifyTracks,
  saveSpotifyTrack,
  checkSpotifySavedTracks,
} from "@/app/actions/spotify";
import { getNotes, upsertNote } from "@/app/actions/notes";

interface SearchTrack {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  note: string;
  saved: boolean;
}

export function SearchContent() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [editingTrack, setEditingTrack] = useState<SearchTrack | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const handleSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setHasSearched(true);

    try {
      const data = await searchSpotifyTracks(q);
      const items: Array<{
        id: string;
        name: string;
        artists: Array<{ name: string }>;
        album: { images: Array<{ url: string }> };
      }> = data.tracks?.items ?? [];

      const trackIds = items.map((t) => t.id);
      const [notes, savedStates] = await Promise.all([
        getNotes(trackIds),
        checkSpotifySavedTracks(trackIds),
      ]);
      const noteMap = new Map(
        notes.map((n: { spotifyTrackId: string; body: string }) => [
          n.spotifyTrackId,
          n.body,
        ]),
      );

      setResults(
        items.map((t, i) => {
          const images = t.album.images;
          return {
            id: t.id,
            name: t.name,
            artist: t.artists.map((a) => a.name).join(", "),
            albumArt: images[images.length > 1 ? 1 : 0]?.url ?? "",
            note: (noteMap.get(t.id) as string) ?? "",
            saved: savedStates[i] ?? false,
          };
        }),
      );
    } finally {
      setSearching(false);
    }
  }, [query]);

  async function handleSave(trackId: string) {
    setSavingIds((prev) => new Set(prev).add(trackId));
    try {
      await saveSpotifyTrack(trackId);
      setResults((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, saved: true } : t)),
      );
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(trackId);
        return next;
      });
    }
  }

  async function handleSaveNote(body: string) {
    if (!editingTrack) return;
    if (!editingTrack.saved) {
      await saveSpotifyTrack(editingTrack.id);
    }
    await upsertNote(editingTrack.id, body);
    setResults((prev) =>
      prev.map((t) =>
        t.id === editingTrack.id ? { ...t, note: body, saved: true } : t,
      ),
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 bg-bg px-4 pb-3 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to listen to?"
            enterKeyHint="search"
            className="flex-1 rounded-full border-0 bg-chip px-4 py-3 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-fg/20"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className="rounded-full bg-fg px-5 py-3 text-sm font-bold text-bg active:opacity-90 disabled:opacity-40"
          >
            {searching ? "\u2026" : "Go"}
          </button>
        </form>
      </div>

      {searching && results.length === 0 && (
        <div className="flex flex-col gap-1 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2.5 animate-pulse"
            >
              <div className="h-14 w-14 shrink-0 rounded-md bg-chip" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-chip" />
                <div className="h-3 w-1/2 rounded bg-chip" />
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col pb-4">
          {results.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              note={track.note}
              onNoteClick={() => setEditingTrack(track)}
              action={
                track.saved ? (
                  <span className="px-2 text-xs font-semibold text-spotify-green">
                    Saved
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSave(track.id)}
                    disabled={savingIds.has(track.id)}
                    className="rounded-full border border-fg/30 px-3 py-1.5 text-xs font-bold text-fg active:bg-chip disabled:opacity-50"
                  >
                    {savingIds.has(track.id) ? "\u2026" : "Save"}
                  </button>
                )
              }
            />
          ))}
        </div>
      )}

      {hasSearched && !searching && results.length === 0 && (
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <p className="text-sm text-muted">No results found.</p>
        </div>
      )}

      {!hasSearched && (
        <div className="flex flex-col items-center justify-center px-5 py-20 text-center">
          <p className="text-[15px] text-muted">
            Find a song to save and annotate.
          </p>
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
      />
    </>
  );
}
