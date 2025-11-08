import type { MidiNoteEvent } from "@/core/midi/types";

export type Incoming = { type: "on" | "off"; note: number; velocity: number; time: number };

const createEventId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function handleIncomingNote(
  e: Incoming,
  opts: {
    audio: { noteOn: (note: number, velocity: number) => void; noteOff: (note: number) => void };
    appendLiveEvent: (event: MidiNoteEvent) => void;
    isRecording: boolean;
    push?: (event: Incoming) => void;
  },
) {
  // 1) sound (always)
  if (e.type === "on") opts.audio.noteOn(e.note, e.velocity);
  else opts.audio.noteOff(e.note);

  // 2) UI live highlights (always).
  const noteId = `typing-${e.note}`;
  const noteEvent: MidiNoteEvent = {
    id: createEventId(),
    noteId,
    noteNumber: e.note,
    channel: 0,
    type: e.type === "on" ? "noteon" : "noteoff",
    velocity: e.velocity,
    timestamp: e.time,
  };
  opts.appendLiveEvent(noteEvent);

  // 3) recording (only if armed)
  if (opts.isRecording && opts.push) opts.push(e);
}
