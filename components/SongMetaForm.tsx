"use client";
import type { Dispatch } from "react";
import { Song } from "@/lib/types";
import { SongAction } from "@/lib/useSongStore";

interface Props {
  song: Song;
  dispatch: Dispatch<SongAction>;
}

export default function SongMetaForm({ song, dispatch }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm">
      <label className="flex flex-col gap-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
        Title
        <input
          value={song.title}
          onChange={(e) =>
            dispatch({ type: "SET_META", meta: { title: e.target.value } })
          }
          className="text-[15px] font-semibold bg-transparent outline-none text-neutral-900 pb-1 border-b border-transparent focus:border-neutral-300 transition-colors"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
        Key
        <input
          value={song.key}
          onChange={(e) =>
            dispatch({ type: "SET_META", meta: { key: e.target.value } })
          }
          placeholder="e.g. G major"
          className="text-[15px] bg-transparent outline-none text-neutral-900 pb-1 border-b border-transparent focus:border-neutral-300 transition-colors placeholder:text-neutral-300"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
        Tempo
        <input
          value={song.tempo}
          onChange={(e) =>
            dispatch({ type: "SET_META", meta: { tempo: e.target.value } })
          }
          placeholder="e.g. 96 BPM"
          className="text-[15px] bg-transparent outline-none text-neutral-900 pb-1 border-b border-transparent focus:border-neutral-300 transition-colors placeholder:text-neutral-300"
        />
      </label>
    </div>
  );
}
