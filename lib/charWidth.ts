import { CHORD_FONT_SIZE, CHORD_FONT_FAMILY } from "./constants";

let cached: number | null = null;

/** Width in px of a single monospace character in the editor grid. */
export function getMonospaceCharWidth(): number {
  if (cached !== null) return cached;
  if (typeof document === "undefined") return CHORD_FONT_SIZE * 0.6;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return CHORD_FONT_SIZE * 0.6;
  ctx.font = `${CHORD_FONT_SIZE}px ${CHORD_FONT_FAMILY}`;
  cached = ctx.measureText("0").width;
  return cached;
}
