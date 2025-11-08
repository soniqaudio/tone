import { create } from "zustand";

interface TransportState {
  playheadMs: number;
  isPlaying: boolean;
  /**
   * AudioContext.currentTime (seconds) captured at the moment playback started.
   * Null when transport is not actively running.
   */
  startContextTimeSec: number | null;
  /**
   * Absolute position (ms) on the timeline when playback started. Used with
   * `startContextTimeSec` to derive the live playhead without accumulating drift.
   */
  startMs: number;
  actions: {
    setPlayheadMs: (ms: number) => void;
    nudgePlayheadMs: (deltaMs: number) => void;
    beginPlayback: (payload: { startMs: number; contextTimeSec: number }) => void;
    updateFromAudioTime: (contextTimeSec: number) => void;
    pause: (payload?: { contextTimeSec?: number }) => void;
    stop: () => void;
    hardSetState: (
      state: Partial<
        Pick<TransportState, "playheadMs" | "isPlaying" | "startMs" | "startContextTimeSec">
      >,
    ) => void;
    scaleTimeline: (ratio: number) => void;
  };
}

const clamp = (value: number) => (value < 0 ? 0 : value);

export const useTransportStore = create<TransportState>((set, get) => ({
  playheadMs: 0,
  isPlaying: false,
  startContextTimeSec: null,
  startMs: 0,
  actions: {
    setPlayheadMs: (ms) =>
      set((state) => {
        const nextMs = clamp(ms);
        if (!state.isPlaying) {
          return { playheadMs: nextMs, startMs: nextMs };
        }
        return {
          playheadMs: nextMs,
          startMs: nextMs,
          startContextTimeSec: get().startContextTimeSec,
        };
      }),
    nudgePlayheadMs: (deltaMs) =>
      set((state) => {
        const nextMs = clamp(state.playheadMs + deltaMs);
        if (!state.isPlaying) {
          return { playheadMs: nextMs, startMs: nextMs };
        }
        return {
          playheadMs: nextMs,
          startMs: nextMs,
          startContextTimeSec: state.startContextTimeSec,
        };
      }),
    beginPlayback: ({ startMs, contextTimeSec }) =>
      set({
        isPlaying: true,
        startMs: clamp(startMs),
        playheadMs: clamp(startMs),
        startContextTimeSec: contextTimeSec,
      }),
    updateFromAudioTime: (contextTimeSec) =>
      set((state) => {
        if (!state.isPlaying || state.startContextTimeSec == null) {
          return state;
        }
        const elapsedSec = Math.max(0, contextTimeSec - state.startContextTimeSec);
        const next = state.startMs + elapsedSec * 1000;
        return { playheadMs: next };
      }),
    pause: (payload) =>
      set((state) => {
        if (!state.isPlaying) {
          return { isPlaying: false, startContextTimeSec: null, startMs: state.playheadMs };
        }

        const contextTimeSec = payload?.contextTimeSec;
        let finalPlayhead = state.playheadMs;
        if (contextTimeSec != null && state.startContextTimeSec != null) {
          const elapsedSec = Math.max(0, contextTimeSec - state.startContextTimeSec);
          finalPlayhead = state.startMs + elapsedSec * 1000;
        }

        const clamped = clamp(finalPlayhead);
        return {
          isPlaying: false,
          playheadMs: clamped,
          startMs: clamped,
          startContextTimeSec: null,
        };
      }),
    stop: () =>
      set({
        isPlaying: false,
        playheadMs: 0,
        startMs: 0,
        startContextTimeSec: null,
      }),
    hardSetState: (partial) => set(partial),
    scaleTimeline: (ratio) =>
      set((state) => {
        if (!Number.isFinite(ratio) || ratio <= 0 || ratio === 1) {
          return state;
        }

        const scale = (value: number) => Math.round(value * ratio);

        const nextPlayhead = scale(state.playheadMs);
        const nextStartMs = scale(state.startMs);

        return {
          playheadMs: nextPlayhead,
          startMs: nextStartMs,
          isPlaying: false,
          startContextTimeSec: null,
        };
      }),
  },
}));
