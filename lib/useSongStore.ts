"use client";
import { useEffect, useReducer, useRef } from "react";
import {
  Song,
  Section,
  ChordMark,
  emptySong,
  newSection,
  newLine,
} from "./types";
import { loadSong, saveSong } from "./storage";

export type SongAction =
  | { type: "LOAD"; song: Song }
  | { type: "SET_META"; meta: Partial<Pick<Song, "title" | "key" | "tempo">> }
  | { type: "ADD_SECTION"; sectionType: "lyrics" | "solo" }
  | { type: "REMOVE_SECTION"; sectionId: string }
  | { type: "RENAME_SECTION"; sectionId: string; name: string }
  | { type: "MOVE_SECTION"; sectionId: string; direction: -1 | 1 }
  | { type: "SPLIT_SECTION"; sectionId: string; lineIndex: number }
  | { type: "SET_LINES_FROM_TEXT"; sectionId: string; text: string }
  | { type: "IMPORT_LYRICS"; text: string }
  | { type: "ADD_LINE"; sectionId: string }
  | {
      type: "UPDATE_LINE_TEXT";
      sectionId: string;
      lineId: string;
      text: string;
    }
  | { type: "REMOVE_LINE"; sectionId: string; lineId: string }
  | {
      type: "ADD_CHORD";
      sectionId: string;
      lineId: string;
      position: number;
      symbol: string;
    }
  | {
      type: "UPDATE_CHORD";
      sectionId: string;
      lineId: string;
      chordId: string;
      patch: Partial<ChordMark>;
    }
  | {
      type: "REMOVE_CHORD";
      sectionId: string;
      lineId: string;
      chordId: string;
    };

function reducer(state: Song, action: SongAction): Song {
  switch (action.type) {
    case "LOAD":
      return action.song;

    case "SET_META":
      return { ...state, ...action.meta };

    case "ADD_SECTION":
      return {
        ...state,
        sections: [...state.sections, newSection(action.sectionType)],
      };

    case "REMOVE_SECTION":
      return {
        ...state,
        sections: state.sections.filter((s) => s.id !== action.sectionId),
      };

    case "RENAME_SECTION":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId ? { ...s, name: action.name } : s,
        ),
      };

    case "MOVE_SECTION": {
      const idx = state.sections.findIndex((s) => s.id === action.sectionId);
      if (idx === -1) return state;
      const newIdx = idx + action.direction;
      if (newIdx < 0 || newIdx >= state.sections.length) return state;
      const sections = [...state.sections];
      [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
      return { ...state, sections };
    }

    case "SPLIT_SECTION": {
      const idx = state.sections.findIndex((s) => s.id === action.sectionId);
      if (idx === -1) return state;
      const s = state.sections[idx];
      if (action.lineIndex <= 0 || action.lineIndex >= s.lines.length)
        return state;
      const first: Section = {
        ...s,
        lines: s.lines.slice(0, action.lineIndex),
      };
      const second: Section = {
        ...newSection(s.type, "New Section"),
        lines: s.lines.slice(action.lineIndex),
      };
      const sections = [...state.sections];
      sections.splice(idx, 1, first, second);
      return { ...state, sections };
    }

    case "SET_LINES_FROM_TEXT": {
      const lines = action.text.split("\n").map((t) => newLine(t));
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? { ...s, lines: lines.length ? lines : [newLine("")] }
            : s,
        ),
      };
    }

    case "IMPORT_LYRICS": {
      const lines = action.text.split("\n").map((t) => newLine(t));
      const section: Section = {
        id: crypto.randomUUID(),
        name: "Verse 1",
        type: "lyrics",
        lines: lines.length ? lines : [newLine("")],
      };
      return { ...state, sections: [...state.sections, section] };
    }

    case "ADD_LINE":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? { ...s, lines: [...s.lines, newLine("")] }
            : s,
        ),
      };

    case "UPDATE_LINE_TEXT":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? {
                ...s,
                lines: s.lines.map((l) =>
                  l.id === action.lineId ? { ...l, text: action.text } : l,
                ),
              }
            : s,
        ),
      };

    case "REMOVE_LINE":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? { ...s, lines: s.lines.filter((l) => l.id !== action.lineId) }
            : s,
        ),
      };

    case "ADD_CHORD":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? {
                ...s,
                lines: s.lines.map((l) =>
                  l.id === action.lineId
                    ? {
                        ...l,
                        chords: [
                          ...l.chords,
                          {
                            id: crypto.randomUUID(),
                            symbol: action.symbol,
                            position: action.position,
                          },
                        ],
                      }
                    : l,
                ),
              }
            : s,
        ),
      };

    case "UPDATE_CHORD":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? {
                ...s,
                lines: s.lines.map((l) =>
                  l.id === action.lineId
                    ? {
                        ...l,
                        chords: l.chords.map((c) =>
                          c.id === action.chordId
                            ? { ...c, ...action.patch }
                            : c,
                        ),
                      }
                    : l,
                ),
              }
            : s,
        ),
      };

    case "REMOVE_CHORD":
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? {
                ...s,
                lines: s.lines.map((l) =>
                  l.id === action.lineId
                    ? {
                        ...l,
                        chords: l.chords.filter((c) => c.id !== action.chordId),
                      }
                    : l,
                ),
              }
            : s,
        ),
      };

    default:
      return state;
  }
}

export function useSongStore() {
  const [song, dispatch] = useReducer(reducer, undefined, () => emptySong());
  const loaded = useRef(false);

  // Load from localStorage once, on mount.
  useEffect(() => {
    dispatch({ type: "LOAD", song: loadSong() });
    loaded.current = true;
  }, []);

  // Persist on every change (debounced).
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => saveSong(song), 300);
    return () => clearTimeout(t);
  }, [song]);

  return { song, dispatch };
}
