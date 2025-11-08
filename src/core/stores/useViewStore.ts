import { create } from "zustand";

export type WorkspaceView = "piano-roll" | "playlist" | "mixer";

interface ViewState {
  activeView: WorkspaceView;
  actions: {
    setActiveView: (view: WorkspaceView) => void;
  };
}

export const useViewStore = create<ViewState>((set) => ({
  activeView: "piano-roll",
  actions: {
    setActiveView: (view) => set({ activeView: view }),
  },
}));
