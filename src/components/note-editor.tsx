"use client";

import { Drawer } from "vaul";
import { useState, useEffect, useRef } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setBody(initialNote);
  }, [initialNote, open]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      textareaRef.current?.scrollIntoView({
        block: "center",
        inline: "nearest",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

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
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      fixed
      repositionInputs={true}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100svh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] flex-col rounded-t-2xl bg-surface outline-none"
          style={{
            paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
          }}
        >
          <Drawer.Handle className="mx-auto mb-2 mt-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />

          <Drawer.Title className="sr-only">
            Note for {track.name}
          </Drawer.Title>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-5 pb-4 pt-1">
            <div className="flex shrink-0 items-center gap-3">
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
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onFocus={(e) => {
                requestAnimationFrame(() => {
                  e.target.scrollIntoView({
                    block: "center",
                    behavior: "smooth",
                  });
                });
              }}
              placeholder="Why does this song matter to you?"
              rows={4}
              className="min-h-[120px] w-full shrink-0 resize-none rounded-xl border border-border bg-elevated p-3.5 text-base leading-relaxed text-fg placeholder:text-faint focus:border-spotify-green focus:outline-none"
              autoComplete="off"
              autoCorrect="on"
              autoFocus
            />

            <div className="flex shrink-0 gap-3 pb-[env(safe-area-inset-bottom,0px)]">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 rounded-xl bg-spotify-green py-3 text-sm font-bold text-bg active:bg-spotify-green-dim disabled:opacity-50"
              >
                {saving ? "Saving\u2026" : "Save note"}
              </button>
              {initialNote && onDelete && (
                <button
                  type="button"
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
