import { useCallback } from "react";
import type { MidiNoteClip } from "@/core/midi/types";

interface UseNoteDeletionProps {
  clips: MidiNoteClip[];
  removeClip: (clipId: string) => void;
  pianoKeys: Array<{ note: string; isBlack: boolean; midi: number }>;
}

export const useNoteDeletion = ({ clips, removeClip, pianoKeys }: UseNoteDeletionProps) => {
  // Delete note at the given position (if one exists)
  const deleteNoteAt = useCallback(
    (pointerMs: number, noteIndex: number) => {
      const clampedNoteIndex = Math.max(0, Math.min(pianoKeys.length - 1, noteIndex));
      const pianoKey = pianoKeys[clampedNoteIndex];
      if (!pianoKey) return;

      const noteNumber = pianoKey.midi;

      // Find the topmost clip at this position (reverse order)
      const clipToRemove = [...clips]
        .reverse()
        .find(
          (clip) =>
            clip.noteNumber === noteNumber &&
            pointerMs >= clip.start &&
            pointerMs <= clip.start + clip.duration,
        );

      if (clipToRemove) {
        removeClip(clipToRemove.id);
      }
    },
    [clips, removeClip, pianoKeys],
  );

  return {
    deleteNoteAt,
  };
};
