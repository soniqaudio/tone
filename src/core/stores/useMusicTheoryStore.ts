import { create } from "zustand";
import type { ScaleName } from "@/core/music/scales";
import { playbackController } from "@/core/playback/playbackController";
import { useMidiStore } from "@/core/stores/useMidiStore";
import { useTransportStore } from "@/core/stores/useTransportStore";

interface MusicTheoryState {
  tempo: number;
  rootNote: string; // e.g., "C", "F#", "Bb"
  scale: ScaleName;
  actions: {
    setTempo: (tempo: number) => void;
    setRootNote: (note: string) => void;
    setScale: (scale: ScaleName) => void;
  };
}

const DEFAULT_TEMPO = 120;
const DEFAULT_ROOT = "C";
const DEFAULT_SCALE: ScaleName = "major";

export const useMusicTheoryStore = create<MusicTheoryState>((set) => ({
  tempo: DEFAULT_TEMPO,
  rootNote: DEFAULT_ROOT,
  scale: DEFAULT_SCALE,
  actions: {
    setTempo: (tempo) =>
      set((state) => {
        const clamped = Math.max(20, Math.min(300, Math.round(tempo)));
        if (state.tempo === clamped) {
          return state;
        }

        const previousTempo = state.tempo;
        const previousMsPerBeat = 60000 / previousTempo;
        const nextMsPerBeat = 60000 / clamped;
        const ratio = nextMsPerBeat / previousMsPerBeat;

        if (Number.isFinite(ratio) && ratio > 0 && ratio !== 1) {
          const midiActions = useMidiStore.getState().actions;
          midiActions.scaleTimeline(ratio);

          const transportState = useTransportStore.getState();
          if (transportState.isPlaying) {
            playbackController.pause();
          }
          transportState.actions.scaleTimeline(ratio);
        }

        return { tempo: clamped };
      }),
    setRootNote: (note) => set({ rootNote: note }),
    setScale: (scale) => set({ scale }),
  },
}));
