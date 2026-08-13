export type SectionType = "lyrics" | "solo";

export interface ChordMark {
  id: string;
  symbol: string;
  /** Character index along the monospace lyric line where the chord sits. */
  position: number;
}

export interface Line {
  id: string;
  text: string;
  chords: ChordMark[];
}

export interface Section {
  id: string;
  name: string;
  type: SectionType;
  lines: Line[];
}

export interface Song {
  title: string;
  key: string;
  tempo: string;
  sections: Section[];
}

export const STORAGE_KEY = "chord-chart-song-v1";

export function emptySong(): Song {
  return { title: "Untitled Song", key: "", tempo: "", sections: [] };
}

export function newLine(text = ""): Line {
  return { id: crypto.randomUUID(), text, chords: [] };
}

export function newSection(
  type: SectionType = "lyrics",
  name?: string,
): Section {
  return {
    id: crypto.randomUUID(),
    name: name ?? (type === "solo" ? "Guitar Solo" : "Verse"),
    type,
    lines:
      type === "solo"
        ? [newLine("/ / / /   / / / /   / / / /   / / / /")]
        : [newLine("")],
  };
}
