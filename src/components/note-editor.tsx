"use client";

import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import Image from "next/image";

interface NoteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
  };
  initialNote: string;
  onSave: (body: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function NoteEditor({
  open,
  onOpenChange,
  track,
  initialNote,
  onSave,
  onDelete,
}: NoteEditorProps) {
  const [body, setBody] = useState(initialNote);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setBody(initialNote);
  }, [initialNote, open]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(body);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[85dvh] flex-col rounded-t-2xl bg-surface safe-bottom">
          <div className="mx-auto mb-2 mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />

          <Drawer.Title className="sr-only">
            Note for {track.name}
          </Drawer.Title>

          <div className="flex flex-col gap-4 overflow-y-auto px-5 pb-6 pt-2">
            <div className="flex items-center gap-3">
              {track.albumArt ? (
                <Image
                  src={track.albumArt}
                  alt=""
                  width={48}
                  height={48}
                  className="shrink-0 rounded-md"
                />
              ) : (
                <div className="h-12 w-12 shrink-0 rounded-md bg-elevated" />
              )}
              <div className="min-w-0">
                <p className="truncate text-[15px] font-medium text-fg">
                  {track.name}
                </p>
                <p className="truncate text-sm text-muted">{track.artist}</p>
              </div>
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Why does this song matter to you?"
              rows={4}
              className="w-full resize-none rounded-xl border border-border bg-elevated p-3.5 text-sm leading-relaxed text-fg placeholder:text-faint focus:border-spotify-green focus:outline-none"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-spotify-green py-3 text-sm font-bold text-bg active:bg-spotify-green-dim disabled:opacity-50"
              >
                {saving ? "Saving\u2026" : "Save note"}
              </button>
              {initialNote && onDelete && (
                <button
                  onClick={async () => {
                    await onDelete();
                    onOpenChange(false);
                  }}
                  className="rounded-xl border border-border px-5 py-3 text-sm text-muted active:bg-elevated"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
