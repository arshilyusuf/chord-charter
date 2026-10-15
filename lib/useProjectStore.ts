"use client";

import { useEffect, useRef, useState } from "react";
import { loadProjects, saveProjects } from "./storage";
import { Song, SongProject, emptySong } from "./types";

function projectName(song: Song) {
  return song.title.trim() || "Untitled Song";
}

function createProject(song: Song): SongProject {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: projectName(song),
    song,
    createdAt: now,
    updatedAt: now,
  };
}

export function useProjectStore(song: Song, loadSong: (song: Song) => void) {
  const [projects, setProjects] = useState<SongProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const pendingProjectLoad = useRef<{ id: string; song: Song } | null>(null);
  const projectsRef = useRef<SongProject[]>([]);
  const currentProjectIdRef = useRef<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const loadedProjects = loadProjects();
      projectsRef.current = loadedProjects;
      setProjects(loadedProjects);
      setIsReady(true);
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!isReady || !currentProjectIdRef.current) return;
    if (pendingProjectLoad.current) {
      if (
        pendingProjectLoad.current.id !== currentProjectIdRef.current ||
        pendingProjectLoad.current.song !== song
      ) {
        return;
      }
      pendingProjectLoad.current = null;
      return;
    }

    const projectId = currentProjectIdRef.current;
    const songToSave = song;
    autosaveTimer.current = setTimeout(() => {
      autosaveTimer.current = null;

      setProjects((currentProjects) => {
        const updated = currentProjects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                song: songToSave,
                name: project.name || projectName(songToSave),
                updatedAt: new Date().toISOString(),
              }
            : project,
        );

        try {
          saveProjects(updated);
          projectsRef.current = updated;
          setStorageError(null);
        } catch {
          setStorageError(
            "This project could not be saved. Your browser storage may be full.",
          );
        }
        return updated;
      });
    }, 400);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
    };
  }, [isReady, song]);

  function createNewProject() {
    const project = createProject(emptySong());
    try {
      cancelAutosave();
      const updated = [project, ...projectsRef.current];
      saveProjects(updated);
      projectsRef.current = updated;
      setProjects(updated);
      currentProjectIdRef.current = project.id;
      setCurrentProjectId(project.id);
      pendingProjectLoad.current = { id: project.id, song: project.song };
      loadSong(project.song);
      setStorageError(null);
    } catch {
      setStorageError("This project could not be created in browser storage.");
    }
  }

  function saveCurrentAsProject(name: string) {
    const project = {
      ...createProject(song),
      name: name.trim() || projectName(song),
    };
    try {
      cancelAutosave();
      const updated = [project, ...projectsRef.current];
      saveProjects(updated);
      projectsRef.current = updated;
      setProjects(updated);
      currentProjectIdRef.current = project.id;
      setCurrentProjectId(project.id);
      setStorageError(null);
    } catch {
      setStorageError("This project could not be saved in browser storage.");
    }
  }

  function openProject(project: SongProject) {
    cancelAutosave();
    pendingProjectLoad.current = { id: project.id, song: project.song };
    currentProjectIdRef.current = project.id;
    setCurrentProjectId(project.id);
    loadSong(project.song);
  }

  function renameProject(id: string, name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    try {
      const updated = projectsRef.current.map((project) =>
        project.id === id
          ? { ...project, name: trimmedName, updatedAt: new Date().toISOString() }
          : project,
      );
      saveProjects(updated);
      projectsRef.current = updated;
      setProjects(updated);
      setStorageError(null);
    } catch {
      setStorageError("This project could not be renamed in browser storage.");
    }
  }

  function deleteProject(id: string) {
    try {
      cancelAutosave();
      const updated = projectsRef.current.filter((project) => project.id !== id);
      saveProjects(updated);
      projectsRef.current = updated;
      setProjects(updated);
      if (currentProjectIdRef.current === id) {
        currentProjectIdRef.current = null;
        setCurrentProjectId(null);
        loadSong(emptySong());
      }
      setStorageError(null);
    } catch {
      setStorageError("This project could not be deleted from browser storage.");
    }
  }

  function detachCurrentProject() {
    cancelAutosave();
    pendingProjectLoad.current = null;
    currentProjectIdRef.current = null;
    setCurrentProjectId(null);
  }

  function cancelAutosave() {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
  }

  return {
    projects,
    currentProjectId,
    isReady,
    storageError,
    createNewProject,
    saveCurrentAsProject,
    openProject,
    renameProject,
    deleteProject,
    detachCurrentProject,
  };
}
