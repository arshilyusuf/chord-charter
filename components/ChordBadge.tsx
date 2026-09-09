"use client";
import { useRef, useState } from "react";
import { ChordMark } from "@/lib/types";
import { CHORD_FONT_FAMILY } from "@/lib/constants";

interface Props {
  chord: ChordMark;
  charWidth: number;
  onMove: (position: number) => void;
  onRename: (symbol: string) => void;
  onDelete: () => void;
}

export default function ChordBadge({
  chord,
  charWidth,
  onMove,
  onRename,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(chord.symbol);
  const dragging = useRef(false);

  function handleMouseDown(e: React.MouseEvent) {
    e.stopPropagation();
    dragging.current = true;
    const row = (e.currentTarget as HTMLElement).closest(
      "[data-chord-row]",
    ) as HTMLElement | null;
    if (!row) return;

    function handleMove(ev: MouseEvent) {
      if (!dragging.current) return;
      const rect = row!.getBoundingClientRect();
      const relX = ev.clientX - rect.left;
      onMove(Math.max(0, Math.round(relX / charWidth)));
    }
    function handleUp() {
      dragging.current = false;
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    }
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }

  if (editing) {
    return (
      <input
        autoFocus
        data-chord
        value={value}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (value.trim()) onRename(value.trim());
          else onDelete();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setValue(chord.symbol);
            setEditing(false);
          }
        }}
        style={{
          left: chord.position * charWidth,
          fontFamily: CHORD_FONT_FAMILY,
        }}
        className="absolute -top-0.5 w-14 text-xs font-bold px-0.5 rounded border border-neutral-900 bg-white text-neutral-900 outline-none z-10"
      />
    );
  }

  return (
    <span
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onDelete();
      }}
      style={{
        left: chord.position * charWidth,
        fontFamily: CHORD_FONT_FAMILY,
      }}
      title="Drag to move · double-click to edit · right-click to delete"
      className="absolute top-0 select-none cursor-grab active:cursor-grabbing text-xs font-bold px-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 whitespace-nowrap"
    >
      {chord.symbol}
    </span>
  );
}
