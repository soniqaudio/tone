export const beatsToPx = (beats: number, pixelsPerBeat: number) => {
  return beats * pixelsPerBeat;
};

export const msToPx = (ms: number, msPerBeat: number, pixelsPerBeat: number) => {
  const beats = ms / msPerBeat;
  return beatsToPx(beats, pixelsPerBeat);
};

export const pxToBeats = (px: number, pixelsPerBeat: number) => {
  return px / pixelsPerBeat;
};

export const pxToMs = (px: number, msPerBeat: number, pixelsPerBeat: number) => {
  const beats = pxToBeats(px, pixelsPerBeat);
  return beats * msPerBeat;
};

export const keyIndexFor = (noteName: string, noteToIndex: Map<string, number>) => {
  return noteToIndex.get(noteName);
};

/**
 * Converts client (mouse) coordinates to coordinates relative to a DOM rect.
 * This is a simple helper that just subtracts the rect position from client coordinates.
 * If the rect is from a scrolled element, the rect position already accounts for scroll.
 */
export const clientToLocalRect = (clientX: number, clientY: number, rect: DOMRect) => {
  // Simply convert client coordinates to coordinates relative to the rect
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  return {
    localX: Math.max(0, localX),
    localY: Math.max(0, localY),
  };
};

export const generatePianoKeys = () => {
  const keys: Array<{ note: string; isBlack: boolean; midi: number }> = [];
  const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  let midiNumber = 21; // A0

  // A0, A#0, B0 manually to align with the midi sequence
  const initialNotes = ["A0", "A#0", "B0"];
  initialNotes.forEach((noteName, index) => {
    keys.push({
      note: noteName,
      isBlack: noteName.includes("#"),
      midi: midiNumber + index,
    });
  });
  midiNumber += initialNotes.length;

  for (let octave = 1; octave <= 8; octave++) {
    for (const note of notes) {
      if (octave === 8 && note !== "C") {
        break;
      }
      const noteName = `${note}${octave}`;
      keys.push({
        note: noteName,
        isBlack: note.includes("#"),
        midi: midiNumber,
      });
      midiNumber += 1;
    }
  }

  return keys.reverse();
};
