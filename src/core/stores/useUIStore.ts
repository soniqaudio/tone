import { create } from "zustand";

// Simplified for SampleMaker - just piano roll scroll state
interface UIState {
  pianoRollScroll: { left: number; top: number };
  pianoRollFollowPlayhead: boolean;
  showGhostNotes: boolean;
  showSustainExtended: boolean;
  showVelocityLane: boolean;
  pianoRollPointer: { ms: number; noteNumber: number };
  pianoRollGridResolution: string;
  cutToolActive: boolean;
  sidebarWidth: number;
  isFullSizeView: boolean;
  pianoRollZoom: number;
  pianoRollKeyHeight: number;
  actions: {
    setPianoRollScroll: (scroll: { left: number; top: number }) => void;
    setPianoRollFollow: (value: boolean) => void;
    setShowGhostNotes: (value: boolean) => void;
    toggleSustainExtended: () => void;
    setShowSustainExtended: (value: boolean) => void;
    toggleVelocityLane: () => void;
    setShowVelocityLane: (value: boolean) => void;
    setPianoRollPointer: (pointer: { ms: number; noteNumber: number }) => void;
    setPianoRollGridResolution: (id: string) => void;
    setCutToolActive: (active: boolean) => void;
    toggleCutTool: () => void;
    setSidebarWidth: (width: number) => void;
    setFullSizeView: (value: boolean) => void;
    toggleFullSizeView: () => void;
    setPianoRollZoom: (zoom: number) => void;
    setPianoRollKeyHeight: (height: number) => void;
  };
}

// Calculate default scroll position to center around C2-C5 range
// Piano roll has 88 keys (A0 to C8), reversed in display
// Original calculation centered on C3
// User requested 1 octave higher: C3 + 12 semitones = C4 (MIDI 60, "middle C")
// C4 is at index 39 from A0 (21)
// In reversed order: 88 - 39 = 49 from top
// With keyHeight=16: 49 * 16 = 784px
// Subtract ~half viewport height (assuming ~600px viewport) = 784 - 300 = 484px
const DEFAULT_SCROLL_TOP = 484;

export const useUIStore = create<UIState>((set) => ({
  pianoRollScroll: { left: 0, top: DEFAULT_SCROLL_TOP },
  pianoRollFollowPlayhead: true,
  showGhostNotes: true,
  showSustainExtended: false,
  showVelocityLane: false,
  pianoRollPointer: { ms: 0, noteNumber: 60 },
  pianoRollGridResolution: "1/16",
  cutToolActive: false,
  sidebarWidth: 288, // Default: w-72 = 288px
  isFullSizeView: false,
  pianoRollZoom: 1.0, // Horizontal zoom multiplier (range: 0.25x - 4.0x)
  pianoRollKeyHeight: 1.0, // Vertical zoom multiplier (range: 0.5x - 3.0x)
  actions: {
    setPianoRollScroll: (scroll) => set({ pianoRollScroll: scroll }),
    setPianoRollFollow: (value) => set({ pianoRollFollowPlayhead: value }),
    setShowGhostNotes: (value) => set({ showGhostNotes: value }),
    toggleSustainExtended: () =>
      set((state) => ({ showSustainExtended: !state.showSustainExtended })),
    setShowSustainExtended: (value) => set({ showSustainExtended: value }),
    toggleVelocityLane: () => set((state) => ({ showVelocityLane: !state.showVelocityLane })),
    setShowVelocityLane: (value) => set({ showVelocityLane: value }),
    setPianoRollPointer: (pointer) => set({ pianoRollPointer: pointer }),
    setPianoRollGridResolution: (id) => set({ pianoRollGridResolution: id }),
    setCutToolActive: (active) => set({ cutToolActive: active }),
    toggleCutTool: () => set((state) => ({ cutToolActive: !state.cutToolActive })),
    setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(600, width)) }),
    setFullSizeView: (value) => set({ isFullSizeView: value }),
    toggleFullSizeView: () => set((state) => ({ isFullSizeView: !state.isFullSizeView })),
    setPianoRollZoom: (zoom) => set({ pianoRollZoom: Math.max(0.25, Math.min(4.0, zoom)) }),
    setPianoRollKeyHeight: (height) => set({ pianoRollKeyHeight: Math.max(0.5, Math.min(3.0, height)) }),
  },
}));
