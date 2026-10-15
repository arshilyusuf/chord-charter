"use client";

import { useState } from "react";
import type { SongProject } from "@/lib/types";

interface Props {
  projects: SongProject[];
  currentProjectId: string | null;
  isReady: boolean;
  storageError: string | null;
  onCreate: () => void;
  onSaveAs: (name: string) => void;
  onOpen: (project: SongProject) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function ProjectLibrary({
  projects,
  currentProjectId,
  isReady,
  storageError,
  onCreate,
  onSaveAs,
  onOpen,
  onRename,
  onDelete,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [projectName, setProjectName] = useState("");

  function saveAs() {
    onSaveAs(projectName);
    setProjectName("");
  }

  return (
    <section className="bg-white border border-neutral-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            Local project library
          </p>
          <p className="text-[13px] text-neutral-500 mt-1">
            Projects stay in this browser and autosave as you edit.
          </p>
        </div>
        <button
          onClick={() => setIsOpen((open) => !open)}
          className="px-3.5 py-2 rounded-full border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
        >
          {isOpen ? "Hide projects" : `Projects (${projects.length})`}
        </button>
      </div>

      {storageError && (
        <p role="alert" className="text-[12px] text-red-600">
          {storageError}
        </p>
      )}

      {isOpen && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveAs();
              }}
              placeholder="Project name"
              className="min-w-0 flex-1 px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 text-[13px] outline-none focus:border-neutral-400"
            />
            <button
              onClick={saveAs}
              className="px-3.5 py-2 rounded-full bg-neutral-900 text-white text-[13px] font-medium hover:bg-neutral-700 transition-colors"
            >
              Save as project
            </button>
            <button
              onClick={onCreate}
              className="px-3.5 py-2 rounded-full border border-neutral-200 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
            >
              New project
            </button>
          </div>

          {isReady && projects.length === 0 ? (
            <p className="text-[13px] text-neutral-400 py-2">
              No saved projects yet. Save this chart to create one.
            </p>
          ) : (
            <div className="divide-y divide-neutral-100 border-t border-neutral-100">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex flex-wrap items-center gap-2 py-3"
                >
                  <button
                    onClick={() => onOpen(project)}
                    className={`min-w-0 flex-1 text-left text-[14px] font-medium ${
                      project.id === currentProjectId
                        ? "text-neutral-900"
                        : "text-neutral-600 hover:text-neutral-900"
                    }`}
                  >
                    <span className="block truncate">{project.name}</span>
                    <span className="block text-[11px] font-normal text-neutral-400 mt-0.5">
                      {new Date(project.updatedAt).toLocaleString()}
                      {project.id === currentProjectId ? " · Open" : ""}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      const name = prompt("Rename project", project.name);
                      if (name !== null) onRename(project.id, name);
                    }}
                    className="px-2.5 py-1.5 rounded-full text-[12px] text-neutral-500 hover:bg-neutral-100"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${project.name}"?`)) {
                        onDelete(project.id);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-full text-[12px] text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
