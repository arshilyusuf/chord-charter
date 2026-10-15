"use client";
import { useMemo, useState } from "react";
import type { Dispatch } from "react";
import { ChordMark, Section } from "@/lib/types";
import { SongAction } from "@/lib/useSongStore";
import { getMonospaceCharWidth } from "@/lib/charWidth";
import LyricLineEditor from "./LyricLineEditor";

interface Props {
  section: Section;
  index: number;
  total: number;
  dispatch: Dispatch<SongAction>;
  copiedChords: ChordMark[] | null;
  onCopyChords: (chords: ChordMark[]) => void;
}

export default function SectionEditor({
  section,
  index,
  total,
  dispatch,
  copiedChords,
  onCopyChords,
}: Props) {
  const charWidth = useMemo(() => getMonospaceCharWidth(), []);
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState("");
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100">
        <input
          value={section.name}
          onChange={(e) =>
            dispatch({
              type: "RENAME_SECTION",
              sectionId: section.id,
              name: e.target.value,
            })
          }
          className="text-[14px] font-semibold bg-transparent outline-none text-neutral-900 flex-1 min-w-0"
        />
        <span className="text-zinc-300 mx-2">Click anywhere above the lyrics to insert a chord</span>
        <span className="text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
          {section.type === "solo" ? "Solo" : "Lyrics"}
        </span>
        <button
          disabled={index === 0}
          onClick={() =>
            dispatch({
              type: "MOVE_SECTION",
              sectionId: section.id,
              direction: -1,
            })
          }
          className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-20 transition-colors"
        >
          ↑
        </button>
        <button
          disabled={index === total - 1}
          onClick={() =>
            dispatch({
              type: "MOVE_SECTION",
              sectionId: section.id,
              direction: 1,
            })
          }
          className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-20 transition-colors"
        >
          ↓
        </button>
        <button
          onClick={() => setShowPaste((v) => !v)}
          className="text-[12px] font-medium text-neutral-500 hover:text-neutral-900 shrink-0 px-2 transition-colors"
        >
          Paste text
        </button>
        <button
          onClick={() =>
            dispatch({ type: "DUPLICATE_SECTION", sectionId: section.id })
          }
          className="text-[12px] font-medium text-neutral-500 hover:text-neutral-900 shrink-0 px-2 transition-colors"
        >
          Duplicate section
        </button>
        <button
          onClick={() =>
            dispatch({ type: "REMOVE_SECTION", sectionId: section.id })
          }
          className="w-6 h-6 flex items-center justify-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-500 shrink-0 transition-colors"
        >
          ✕
        </button>
      </div>

      {showPaste && (
        <div className="p-3.5 border-b border-neutral-100 space-y-2 bg-neutral-50/50">
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            placeholder="Paste or type lines for this section…"
            className="w-full text-sm font-mono p-2.5 rounded-xl border border-neutral-200 bg-white outline-none focus:border-neutral-400 transition-colors"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                dispatch({
                  type: "SET_LINES_FROM_TEXT",
                  sectionId: section.id,
                  text: pasteText,
                });
                setShowPaste(false);
                setPasteText("");
              }}
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
            >
              Replace lines
            </button>
            <button
              onClick={() => setShowPaste(false)}
              className="text-[12px] font-medium px-3.5 py-1.5 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="p-4 space-y-1.5">
        {section.lines.map((line, i) => (
          <div key={line.id} className="group/split relative">
            <LyricLineEditor
              line={line}
              charWidth={charWidth}
              onAddChord={(position, symbol) =>
                dispatch({
                  type: "ADD_CHORD",
                  sectionId: section.id,
                  lineId: line.id,
                  position,
                  symbol,
                })
              }
              onMoveChord={(chordId, position) =>
                dispatch({
                  type: "UPDATE_CHORD",
                  sectionId: section.id,
                  lineId: line.id,
                  chordId,
                  patch: { position },
                })
              }
              onRenameChord={(chordId, symbol) =>
                dispatch({
                  type: "UPDATE_CHORD",
                  sectionId: section.id,
                  lineId: line.id,
                  chordId,
                  patch: { symbol },
                })
              }
              onDeleteChord={(chordId) =>
                dispatch({
                  type: "REMOVE_CHORD",
                  sectionId: section.id,
                  lineId: line.id,
                  chordId,
                })
              }
              onChangeText={(text) =>
                dispatch({
                  type: "UPDATE_LINE_TEXT",
                  sectionId: section.id,
                  lineId: line.id,
                  text,
                })
              }
              onDeleteLine={() =>
                dispatch({
                  type: "REMOVE_LINE",
                  sectionId: section.id,
                  lineId: line.id,
                })
              }
              onCopyChords={() => onCopyChords(line.chords)}
              onPasteChords={() =>
                dispatch({
                  type: "REPLACE_LINE_CHORDS",
                  sectionId: section.id,
                  lineId: line.id,
                  chords: copiedChords ?? [],
                })
              }
              canPasteChords={copiedChords !== null}
            />
            {i < section.lines.length - 1 && (
              <button
                onClick={() =>
                  dispatch({
                    type: "SPLIT_SECTION",
                    sectionId: section.id,
                    lineIndex: i + 1,
                  })
                }
                title="Split into a new section here"
                className="opacity-0 group-hover/split:opacity-100 transition-opacity absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-neutral-900 text-white shadow-sm z-10"
              >
                ✂ Split here
              </button>
            )}
          </div>
        ))}
        <button
          onClick={() => dispatch({ type: "ADD_LINE", sectionId: section.id })}
          className="text-[12px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          + Add line
        </button>
      </div>
    </div>
  );
}
