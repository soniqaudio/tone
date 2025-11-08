import type { MidiNoteClip } from "@/core/midi/types";

export interface OrderedClip {
  id: string;
  noteNumber: number;
  velocity: number | undefined;
  startMs: number;
  durationMs: number;
}

export interface PreparedClipSet {
  clips: OrderedClip[];
  totalDurationMs: number;
}

export const prepareClipsForPlayback = (clips: MidiNoteClip[]): PreparedClipSet => {
  const ordered: OrderedClip[] = clips
    .map((clip) => ({
      id: clip.id,
      noteNumber: clip.noteNumber,
      velocity: clip.velocity,
      startMs: clip.start,
      durationMs: clip.duration,
    }))
    .sort((a, b) => a.startMs - b.startMs);

  const totalDurationMs = ordered.reduce((max, clip) => {
    const end = clip.startMs + clip.durationMs;
    return end > max ? end : max;
  }, 0);

  return { clips: ordered, totalDurationMs };
};

export const findFirstPlayableIndex = (clips: OrderedClip[], startMs: number): number => {
  if (clips.length === 0) return 0;

  let low = 0;
  let high = clips.length - 1;
  let result = clips.length;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const clip = clips[mid];
    const clipEnd = clip.startMs + clip.durationMs;

    if (clipEnd > startMs) {
      result = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return result;
};
