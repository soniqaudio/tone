import { create } from "zustand";

interface ClipboardItem {
  offset: number;
  duration: number;
  noteNumber: number;
  velocity: number | undefined;
  trackId: string;
  channel: number;
}

interface MidiClipboard {
  items: ClipboardItem[];
  baseNoteNumber: number;
}

interface ClipboardState {
  clipboard: MidiClipboard | null;
  actions: {
    setClipboard: (clipboard: MidiClipboard | null) => void;
    clearClipboard: () => void;
  };
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  clipboard: null,
  actions: {
    setClipboard: (clipboard) => set({ clipboard }),
    clearClipboard: () => set({ clipboard: null }),
  },
}));
