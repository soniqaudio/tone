// Scale intervals in semitones from root
export const SCALE_INTERVALS = {
  // Major scales
  major: [0, 2, 4, 5, 7, 9, 11], // Ionian
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10], // Natural Minor
  locrian: [0, 1, 3, 5, 6, 8, 10],

  // Minor scales
  minor: [0, 2, 3, 5, 7, 8, 10], // Natural Minor (same as aeolian)
  "natural minor": [0, 2, 3, 5, 7, 8, 10],
  "harmonic minor": [0, 2, 3, 5, 7, 8, 11],
  "melodic minor": [0, 2, 3, 5, 7, 9, 11],

  // Pentatonic
  "major pentatonic": [0, 2, 4, 7, 9],
  "minor pentatonic": [0, 3, 5, 7, 10],

  // Blues
  blues: [0, 3, 5, 6, 7, 10],

  // Other
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  "whole tone": [0, 2, 4, 6, 8, 10],
} as const;

export type ScaleName = keyof typeof SCALE_INTERVALS;

// Note names
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function noteNameToMidi(noteName: string): number {
  const match = noteName.match(/^([A-G]#?)(-?\d+)$/);
  if (!match) return 60; // fallback to C4

  const [, note, octaveStr] = match;
  const octave = parseInt(octaveStr, 10);
  const noteIndex = NOTE_NAMES.indexOf(note);

  return (octave + 1) * 12 + noteIndex;
}

export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const noteIndex = midi % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
}

// Generate MIDI notes for a scale starting from a root note
export function generateScaleMidi(rootMidi: number, scaleName: ScaleName): number[] {
  const intervals = SCALE_INTERVALS[scaleName];
  return intervals.map((interval) => rootMidi + interval);
}

// Get available scale names for UI (stable order)
export function getScaleNames(): ScaleName[] {
  return [
    "major",
    "minor",
    "harmonic minor",
    "dorian",
    "phrygian",
    "lydian",
    "locrian",
  ] as ScaleName[];
}

// Get root notes for UI (all 12 chromatic notes)
export function getRootNotes(): string[] {
  return NOTE_NAMES;
}
