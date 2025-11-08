import { Midi } from "@tonejs/midi";
import { deriveFromEvents as deriveFromEventsCore } from "@/core/midi/derive";
import type { MidiDomainEvent } from "@/core/midi/types";
import type { MidiState } from "../types";

export const createFileActions = (
  _get: () => MidiState,
  set: (partial: Partial<MidiState> | ((state: MidiState) => Partial<MidiState>)) => void,
  clearRecordingState: () => void,
) => ({
  loadFromArrayBuffer: async (buffer: ArrayBuffer) => {
    clearRecordingState();
    set({ status: "loading" as const, error: undefined });
    try {
      const midi = new Midi(buffer);
      const events: MidiDomainEvent[] = [];

      midi.tracks.forEach((track) => {
        track.notes.forEach((note) => {
          const noteId = `clip-${note.midi}-${note.time}-${Math.random().toString(16).slice(2)}`;
          const startMs = note.time * 1000;
          const endMs = (note.time + note.duration) * 1000;

          events.push({
            id: `evt-${noteId}-on`,
            type: "noteOn",
            timestamp: startMs,
            noteNumber: note.midi,
            velocity: note.velocity,
            channel: track.channel ?? 0,
            noteId,
          });

          events.push({
            id: `evt-${noteId}-off`,
            type: "noteOff",
            timestamp: endMs,
            noteNumber: note.midi,
            velocity: note.velocity,
            channel: track.channel ?? 0,
            noteId,
          });
        });

        Object.entries(track.controlChanges ?? {}).forEach(([controller, changes]) => {
          changes.forEach((change) => {
            events.push({
              id: `evt-cc-${controller}-${change.time}-${Math.random().toString(16).slice(2)}`,
              type: "cc",
              timestamp: change.time * 1000,
              controller: Number.parseInt(controller, 10),
              value: Math.round((change.value ?? 0) * 127),
              channel: track.channel ?? 0,
            });
          });
        });
      });

      const derived = deriveFromEventsCore(events);

      set({
        midi,
        clips: derived.clips,
        events,
        clipsWithoutSustain: derived.clipsWithoutSustain,
        controlEvents: derived.controlEvents,
        status: "ready" as const,
      });
    } catch (error) {
      set({
        midi: null,
        status: "error" as const,
        error: error instanceof Error ? error.message : "Failed to parse MIDI",
      });
    }
  },

  reset: () => {
    clearRecordingState();
    set({
      midi: null,
      status: "idle" as const,
      error: undefined,
      devices: [],
      selectedInputId: undefined,
      clips: [],
      events: [],
      clipsWithoutSustain: [],
      controlEvents: [],
      liveEvents: [],
      isRecording: false,
      computerInputEnabled: true,
      recordArm: false,
      midiAccessState: "initial",
      midiAccessError: undefined,
      midiAccessRequestToken: 0,
      recordingPreviewClips: [],
      recordingPreviewMeta: {},
    });
  },
});
