import { deriveFromEvents as deriveFromEventsCore } from "@/core/midi/derive";
import type { MidiAccessState, MidiDeviceInfo, MidiNoteEvent } from "@/core/midi/types";
import type { MidiState } from "../types";

export const createDeviceActions = (
  get: () => MidiState,
  set: (partial: Partial<MidiState> | ((state: MidiState) => Partial<MidiState>)) => void,
) => ({
  setDevices: (devices: MidiDeviceInfo[]) => set({ devices }),

  selectInput: (deviceId?: string) => set({ selectedInputId: deviceId }),

  setMidiAccessState: (stateValue: MidiAccessState) => set({ midiAccessState: stateValue }),

  setMidiAccessError: (message: string | undefined) => set({ midiAccessError: message }),

  triggerMidiAccessRequest: () =>
    set((state) => ({ midiAccessRequestToken: state.midiAccessRequestToken + 1 })),

  setLiveEvents: (events: MidiNoteEvent[]) => set({ liveEvents: events }),

  scaleTimeline: (ratio: number) => {
    if (!Number.isFinite(ratio) || ratio <= 0 || ratio === 1) {
      return;
    }

    const state = get();
    const scaledEvents = state.events.map((event) => ({
      ...event,
      timestamp: Math.round(event.timestamp * ratio),
    }));

    const derived = deriveFromEventsCore(scaledEvents, undefined, state.clips);

    const scaledLiveEvents = state.liveEvents.map((event) => ({
      ...event,
      timestamp: Math.max(0, Math.round(event.timestamp * ratio)),
    }));

    set({
      events: scaledEvents,
      clips: derived.clips,
      clipsWithoutSustain: derived.clipsWithoutSustain,
      controlEvents: derived.controlEvents,
      liveEvents: scaledLiveEvents,
    });
  },
});
