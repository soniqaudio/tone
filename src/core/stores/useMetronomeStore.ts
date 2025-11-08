import { create } from "zustand";

interface MetronomeState {
  enabled: boolean;
  volume: number; // 0-1
  actions: {
    toggle: () => void;
    setEnabled: (enabled: boolean) => void;
    setVolume: (volume: number) => void;
  };
}

export const useMetronomeStore = create<MetronomeState>((set) => ({
  enabled: false,
  volume: 0.8,
  actions: {
    toggle: () => set((state) => ({ enabled: !state.enabled })),
    setEnabled: (enabled) => set({ enabled }),
    setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  },
}));
