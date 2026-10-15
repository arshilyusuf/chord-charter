import {
  Song,
  SongProject,
  PROJECTS_STORAGE_KEY,
  STORAGE_KEY,
  emptySong,
} from "./types";

export function loadSong(): Song {
  if (typeof window === "undefined") return emptySong();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySong();
    return JSON.parse(raw) as Song;
  } catch {
    return emptySong();
  }
}

export function saveSong(song: Song) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(song));
  } catch {
    // storage full/unavailable — fail silently
  }
}

export function clearSong() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

function isProject(value: unknown): value is SongProject {
  if (!value || typeof value !== "object") return false;
  const project = value as Partial<SongProject>;
  return (
    typeof project.id === "string" &&
    typeof project.name === "string" &&
    typeof project.createdAt === "string" &&
    typeof project.updatedAt === "string" &&
    !!project.song &&
    typeof project.song === "object"
  );
}

export function loadProjects(): SongProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isProject) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: SongProject[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}
