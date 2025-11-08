import { create } from "zustand";
import { loadDefaultSounds } from "@/core/utils/loadDefaultSounds";

export interface GeneratedSound {
  id: string;
  name: string;
  description: string;
  audioBlob: Blob;
  createdAt: number;
}

interface SoundState {
  sounds: GeneratedSound[];
  activeSoundId: string | null;
  isGenerating: boolean;
  isLoadingDefaults: boolean;
  actions: {
    addSound: (sound: GeneratedSound) => void;
    removeSound: (soundId: string) => void;
    setActiveSound: (soundId: string | null) => void;
    setGenerating: (value: boolean) => void;
    getActiveSound: () => GeneratedSound | null;
    initializeDefaultSounds: () => Promise<void>;
  };
}

export const useSoundStore = create<SoundState>((set, get) => ({
  sounds: [],
  activeSoundId: null,
  isGenerating: false,
  isLoadingDefaults: false,
  actions: {
    addSound: (sound) =>
      set((state) => ({
        sounds: [sound, ...state.sounds],
      })),
    removeSound: (soundId) =>
      set((state) => ({
        sounds: state.sounds.filter((s) => s.id !== soundId),
        activeSoundId: state.activeSoundId === soundId ? null : state.activeSoundId,
      })),
    setActiveSound: (soundId) => set({ activeSoundId: soundId }),
    setGenerating: (value) => set({ isGenerating: value }),
    getActiveSound: () => {
      const state = get();
      return state.sounds.find((s) => s.id === state.activeSoundId) || null;
    },
    initializeDefaultSounds: async () => {
      const state = get();
      // Only load once
      if (state.isLoadingDefaults || state.sounds.length > 0) return;

      set({ isLoadingDefaults: true });
      try {
        const defaultSounds = await loadDefaultSounds();
        set({ sounds: defaultSounds });
      } catch (error) {
        console.error("Failed to load default sounds:", error);
      } finally {
        set({ isLoadingDefaults: false });
      }
    },
  },
}));
