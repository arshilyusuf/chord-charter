"use client";
import { useState } from "react";
import Image from "next/image";
import { useSongStore } from "@/lib/useSongStore";
import { ChordMark, emptySong } from "@/lib/types";
import { useProjectStore } from "@/lib/useProjectStore";
import { exportSongToPdf } from "@/lib/pdfExport";
import SongMetaForm from "@/components/SongMetaForm";
import SectionEditor from "@/components/SectionEditor";
import ProjectLibrary from "@/components/ProjectLibrary";

export default function Page() {
  const { song, dispatch } = useSongStore();
  const projectStore = useProjectStore(song, (nextSong) =>
    dispatch({ type: "LOAD", song: nextSong }),
  );
  const [importText, setImportText] = useState("");
  const [transposeAmount, setTransposeAmount] = useState(0);
  const [copiedChords, setCopiedChords] = useState<ChordMark[] | null>(null);

  function changeTranspose(semitones: -1 | 1) {
    if (transposeAmount + semitones < -11 || transposeAmount + semitones > 11)
      return;

    dispatch({ type: "TRANSPOSE", semitones });
    setTransposeAmount(transposeAmount + semitones);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1 justify-center items-left">
          <Image
            src="/Shruti26%20Profile%20Picture-15.png"
            alt="Raaga The Music Club"
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 object-contain"
          />
          <h1 className="flex-1 min-w-0 text-[22px] font-semibold tracking-tight text-neutral-900">
            Raaga The Music Club - Chord Chart Maker
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeTranspose(-1)}
            disabled={transposeAmount === -11 || song.sections.length === 0}
            aria-label="Transpose down one semitone"
            title="Transpose down one semitone"
            className="w-8 h-8 rounded-full border border-neutral-200 text-[16px] font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 transition-colors"
          >
            -
          </button>
          <span
            aria-live="polite"
            className="min-w-20 text-center text-[12px] font-medium text-neutral-900"
          >
            Transpose{" "}
            {transposeAmount > 0 ? `+${transposeAmount}` : transposeAmount}
          </span>
          <button
            onClick={() => changeTranspose(1)}
            disabled={transposeAmount === 11 || song.sections.length === 0}
            aria-label="Transpose up one semitone"
            title="Transpose up one semitone"
            className="w-8 h-8 rounded-full border border-neutral-200 text-[16px] font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-30 transition-colors"
          >
            +
          </button>
          <button
            onClick={() => {
              if (confirm("Clear the current song? This cannot be undone.")) {
                projectStore.detachCurrentProject();
                dispatch({ type: "LOAD", song: emptySong() });
                setTransposeAmount(0);
              }
            }}
            className="px-3.5 py-2 rounded-full text-[13px] font-medium text-neutral-500 hover:bg-neutral-100 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => void exportSongToPdf(song)}
            className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-700 text-white text-[13px] font-medium transition-colors shadow-sm"
          >
            Export PDF
          </button>
        </div>
      </div>

      <ProjectLibrary
        projects={projectStore.projects}
        currentProjectId={projectStore.currentProjectId}
        isReady={projectStore.isReady}
        storageError={projectStore.storageError}
        onCreate={projectStore.createNewProject}
        onSaveAs={projectStore.saveCurrentAsProject}
        onOpen={projectStore.openProject}
        onRename={projectStore.renameProject}
        onDelete={projectStore.deleteProject}
      />

      <SongMetaForm song={song} dispatch={dispatch} />

      {song.sections.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-3 shadow-sm">
          <p className="text-[13px] text-neutral-500 leading-relaxed">
            Paste the full lyrics of your song below to get started. You can
            split it into sections, rename them, and add chords next.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={10}
            placeholder="Paste full lyrics here…"
            className="w-full font-mono text-sm p-3.5 rounded-xl border border-neutral-200 bg-neutral-50 outline-none focus:border-neutral-400 transition-colors"
          />
          <div className="flex gap-2 pt-1">
            <button
              onClick={() =>
                dispatch({ type: "ADD_SECTION", sectionType: "lyrics" })
              }
              className="text-[13px] font-medium px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              Start blank instead
            </button>
            <button
              disabled={!importText.trim()}
              onClick={() => {
                dispatch({ type: "IMPORT_LYRICS", text: importText });
                setImportText("");
              }}
              className="text-[13px] font-medium px-4 py-2 rounded-full bg-neutral-900 hover:bg-neutral-700 text-white disabled:opacity-30 disabled:hover:bg-neutral-900 transition-colors"
            >
              Insert
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {song.sections.map((section, i) => (
            <SectionEditor
              key={section.id}
              section={section}
              index={i}
              total={song.sections.length}
              dispatch={dispatch}
              copiedChords={copiedChords}
              onCopyChords={setCopiedChords}
            />
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() =>
            dispatch({ type: "ADD_SECTION", sectionType: "lyrics" })
          }
          className="text-[13px] font-medium px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          + Add Section
        </button>
        <button
          onClick={() => dispatch({ type: "ADD_SECTION", sectionType: "solo" })}
          className="text-[13px] font-medium px-4 py-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          + Add Solo Section
        </button>
      </div>
    </main>
  );
}
