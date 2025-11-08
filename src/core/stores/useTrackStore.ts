import { create } from "zustand";

export interface Track {
  id: string;
  name: string;
  soundId: string | null; // Reference to a sound from useSoundStore
  volume: number; // 0-1
  muted: boolean;
  solo: boolean;
  color: string; // Hex color for visual distinction
}

interface TrackState {
  tracks: Track[];
  activeTrackId: string | null;
  actions: {
    addTrack: (name: string, color?: string) => string; // Returns new track ID
    removeTrack: (trackId: string) => void;
    updateTrack: (trackId: string, updates: Partial<Track>) => void;
    setActiveTrack: (trackId: string | null) => void;
    assignSoundToTrack: (trackId: string, soundId: string | null) => void;
    getTrack: (trackId: string) => Track | undefined;
  };
}

const TRACK_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

let colorIndex = 0;

const getNextColor = () => TRACK_COLORS[colorIndex++ % TRACK_COLORS.length];

const createTrack = (name: string, color?: string): Track => ({
  id: `track-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  name,
  soundId: null,
  volume: 0.8,
  muted: false,
  solo: false,
  color: color ?? getNextColor(),
});

const defaultTrack = createTrack("Track 1");

export const useTrackStore = create<TrackState>((set, get) => ({
  tracks: [defaultTrack], // Start with one default track
  activeTrackId: defaultTrack.id,
  actions: {
    addTrack: (name, color) => {
      const newTrack = createTrack(name, color);
      set((state) => ({
        tracks: [...state.tracks, newTrack],
      }));
      return newTrack.id;
    },
    removeTrack: (trackId) =>
      set((state) => ({
        tracks: state.tracks.filter((t) => t.id !== trackId),
        activeTrackId: state.activeTrackId === trackId ? null : state.activeTrackId,
      })),
    updateTrack: (trackId, updates) =>
      set((state) => ({
        tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, ...updates } : t)),
      })),
    setActiveTrack: (trackId) =>
      set((state) => {
        if (!trackId) {
          return { activeTrackId: state.tracks[0]?.id ?? null };
        }

        if (trackId === "track-default" || trackId === "__fallback-track__") {
          return { activeTrackId: state.tracks[0]?.id ?? null };
        }

        const exists = state.tracks.some((track) => track.id === trackId);
        if (exists) {
          return { activeTrackId: trackId };
        }

        return { activeTrackId: state.tracks[0]?.id ?? state.activeTrackId };
      }),
    assignSoundToTrack: (trackId, soundId) =>
      set((state) => ({
        tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, soundId } : t)),
      })),
    getTrack: (trackId) => {
      return get().tracks.find((t) => t.id === trackId);
    },
  },
}));
