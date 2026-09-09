const SHARP_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const NOTE_VALUES: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function transposeNote(note: string, semitones: number) {
  const normalizedNote = note[0].toUpperCase() + note.slice(1);
  const value = NOTE_VALUES[normalizedNote];
  if (value === undefined) return note;

  const transposed = SHARP_NOTES[(((value + semitones) % 12) + 12) % 12];
  return note[0] === note[0].toLowerCase()
    ? transposed.toLowerCase()
    : transposed;
}

export function transposeChordSymbol(symbol: string, semitones: number) {
  return symbol.replace(
    /(^|\/)([A-Ga-g])([#b]?)/g,
    (_match, prefix: string, letter: string, accidental: string) => {
      const note = letter + accidental;
      return prefix + transposeNote(note, semitones);
    },
  );
}

export function transposeKey(key: string, semitones: number) {
  return key.replace(
    /(^\s*)([A-Ga-g])([#b]?)/,
    (_match, prefix: string, letter: string, accidental: string) =>
      prefix + transposeNote(letter + accidental, semitones),
  );
}
