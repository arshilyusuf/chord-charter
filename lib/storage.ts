import { Song, STORAGE_KEY, emptySong } from "./types";

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
