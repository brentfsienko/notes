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
        <Drawer.Overlay className="fixed inset-0 bg-charcoal/30 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 bg-paper rounded-t-2xl max-h-[85dvh] flex flex-col safe-bottom">
          <div className="mx-auto w-12 h-1.5 shrink-0 rounded-full bg-sand mt-3 mb-2" />

          <Drawer.Title className="sr-only">
            Note for {track.name}
          </Drawer.Title>

          <div className="px-5 pb-6 pt-2 flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center gap-3">
              {track.albumArt ? (
                <Image
                  src={track.albumArt}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-lg shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg shrink-0 bg-sand" />
              )}
              <div className="min-w-0">
                <p className="font-medium text-charcoal truncate text-[15px]">
                  {track.name}
                </p>
                <p className="text-sm text-bark truncate">{track.artist}</p>
              </div>
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Why does this song matter to you?"
              rows={4}
              className="w-full p-3.5 rounded-xl bg-cream border border-sand text-charcoal placeholder:text-stone resize-none text-sm leading-relaxed focus:outline-none focus:border-sage transition-colors"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-sage text-paper font-medium text-sm active:bg-moss transition-colors disabled:opacity-50"
              >
                {saving ? "Saving\u2026" : "Save note"}
              </button>
              {initialNote && onDelete && (
                <button
                  onClick={async () => {
                    await onDelete();
                    onOpenChange(false);
                  }}
                  className="px-5 py-3 rounded-xl border border-sand text-bark text-sm active:bg-cream transition-colors"
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
