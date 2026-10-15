"use client";
import { useState } from "react";
import { Line } from "@/lib/types";
import {
  CHORD_FONT_FAMILY,
  CHORD_FONT_SIZE,
} from "@/lib/constants";
import ChordBadge from "./ChordBadge";

interface Props {
  line: Line;
  charWidth: number;
  onAddChord: (position: number, symbol: string) => void;
  onMoveChord: (chordId: string, position: number) => void;
  onRenameChord: (chordId: string, symbol: string) => void;
  onDeleteChord: (chordId: string) => void;
  onChangeText: (text: string) => void;
  onDeleteLine: () => void;
  onCopyChords: () => void;
  onPasteChords: () => void;
  canPasteChords: boolean;
}

export default function LyricLineEditor({
  line,
  charWidth,
  onAddChord,
  onMoveChord,
  onRenameChord,
  onDeleteChord,
  onChangeText,
  onDeleteLine,
  onCopyChords,
  onPasteChords,
  canPasteChords,
}: Props) {
  const [pending, setPending] = useState<{
    position: number;
    value: string;
  } | null>(null);

  function handleRowClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-chord]")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const position = Math.max(
      0,
      Math.round((e.clientX - rect.left) / charWidth),
    );
    setPending({ position, value: "" });
  }

  return (
    <div className="group relative flex items-start gap-2 rounded-lg px-1 -mx-1 hover:bg-neutral-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div
          data-chord-row
          className="relative h-5 cursor-text"
          onClick={handleRowClick}
        >
          {line.chords.map((c) => (
            <span data-chord key={c.id}>
              <ChordBadge
                chord={c}
                charWidth={charWidth}
                onMove={(p) => onMoveChord(c.id, p)}
                onRename={(s) => onRenameChord(c.id, s)}
                onDelete={() => onDeleteChord(c.id)}
              />
            </span>
          ))}
          {pending && (
            <input
              autoFocus
              data-chord
              value={pending.value}
              placeholder="chord"
              onClick={(e) => e.stopPropagation()}
              onChange={(e) =>
                setPending({ ...pending, value: e.target.value })
              }
              onBlur={() => {
                if (pending.value.trim())
                  onAddChord(pending.position, pending.value.trim());
                setPending(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setPending(null);
              }}
              style={{
                left: pending.position * charWidth,
                fontFamily: CHORD_FONT_FAMILY,
              }}
              className="absolute top-0 w-14 text-xs font-normal px-0.5 rounded border border-neutral-900 bg-white text-neutral-900 outline-none z-10"
            />
          )}
        </div>
        <input
          value={line.text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Type lyric line…"
          style={{ fontFamily: CHORD_FONT_FAMILY, fontSize: CHORD_FONT_SIZE }}
          className="w-full bg-transparent font-normal leading-6 outline-none text-neutral-800 placeholder:text-neutral-300"
        />
      </div>
      <button
        onClick={onCopyChords}
        title="Copy chords from this line"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-300 hover:text-neutral-700 text-xs mt-1"
      >
        Copy chords
      </button>
      <button
        onClick={onPasteChords}
        disabled={!canPasteChords}
        title="Replace this line's chords with the copied chords"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-300 hover:text-neutral-700 disabled:pointer-events-none disabled:opacity-20 text-xs mt-1"
      >
        Paste chords
      </button>
      <button
        onClick={onDeleteLine}
        title="Delete line"
        className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-300 hover:text-red-500 text-xs mt-1"
      >
        ✕
      </button>
    </div>
  );
}
