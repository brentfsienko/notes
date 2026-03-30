"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [visible, setVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setBody(initialNote);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      const t = setTimeout(() => textareaRef.current?.focus(), 380);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [initialNote, open]);

  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => onOpenChange(false), 300);
  }, [onOpenChange]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(body);
      handleClose();
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
        aria-hidden
      />

      <div
        className={`absolute inset-0 flex flex-col bg-bg transition-transform duration-300 ease-out will-change-transform ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        role="dialog"
        aria-label={`Note for ${track.name}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="min-w-[60px] text-left text-sm text-muted active:text-fg transition-colors"
          >
            cancel
          </button>
          <p className="truncate text-sm font-light tracking-wide text-fg">note</p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="min-w-[60px] text-right text-sm text-accent active:text-accent-dim disabled:opacity-50 transition-colors"
          >
            {saving ? "saving\u2026" : "save"}
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-3 px-4 py-3">
          {track.albumArt ? (
            <Image
              src={track.albumArt}
              alt=""
              width={44}
              height={44}
              className="shrink-0 rounded"
            />
          ) : (
            <div className="h-11 w-11 shrink-0 rounded bg-elevated" />
          )}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-normal text-fg">
              {track.name}
            </p>
            <p className="truncate text-sm text-muted">{track.artist}</p>
          </div>
        </div>

        <div className="min-h-0 flex-1 px-4 pb-2">
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="why does this song matter to you?"
            className="h-full w-full resize-none bg-transparent text-[15px] leading-relaxed text-fg placeholder:text-faint/60 focus:outline-none"
            autoComplete="off"
            autoCorrect="on"
          />
        </div>

        {initialNote && onDelete && (
          <div className="shrink-0 border-t border-border/60 px-4 py-3">
            <button
              type="button"
              onClick={async () => {
                await onDelete();
                handleClose();
              }}
              className="text-sm text-faint active:text-muted transition-colors"
            >
              delete note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
