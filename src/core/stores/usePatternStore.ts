import { create } from "zustand";

export interface Pattern {
  id: string;
  name: string;
  trackId: string; // Which track this pattern belongs to
  color: string; // Hex color for visual distinction
  createdAt: number;
  updatedAt: number;
}

interface PatternState {
  patterns: Pattern[];
  editingPatternId: string | null; // Which pattern is currently being edited in piano roll
  actions: {
    createPattern: (name: string, trackId: string, color?: string) => string; // Returns new pattern ID
    updatePattern: (patternId: string, updates: Partial<Omit<Pattern, "id" | "createdAt">>) => void;
    deletePattern: (patternId: string) => void;
    setEditingPattern: (patternId: string | null) => void;
    getPattern: (patternId: string) => Pattern | undefined;
    getPatternsByTrack: (trackId: string) => Pattern[];
  };
}

const PATTERN_COLORS = [
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

const getNextColor = () => PATTERN_COLORS[colorIndex++ % PATTERN_COLORS.length];

const createPattern = (name: string, trackId: string, color?: string): Pattern => {
  const now = Date.now();
  return {
    id: `pattern-${now}-${Math.random().toString(16).slice(2)}`,
    name,
    trackId,
    color: color ?? getNextColor(),
    createdAt: now,
    updatedAt: now,
  };
};

export const usePatternStore = create<PatternState>((set, get) => ({
  patterns: [],
  editingPatternId: null,
  actions: {
    createPattern: (name, trackId, color) => {
      const newPattern = createPattern(name, trackId, color);
      set((state) => ({
        patterns: [...state.patterns, newPattern],
      }));
      return newPattern.id;
    },
    updatePattern: (patternId, updates) =>
      set((state) => ({
        patterns: state.patterns.map((p) =>
          p.id === patternId
            ? { ...p, ...updates, updatedAt: Date.now() }
            : p,
        ),
      })),
    deletePattern: (patternId) =>
      set((state) => ({
        patterns: state.patterns.filter((p) => p.id !== patternId),
        editingPatternId: state.editingPatternId === patternId ? null : state.editingPatternId,
      })),
    setEditingPattern: (patternId) => set({ editingPatternId: patternId }),
    getPattern: (patternId) => {
      return get().patterns.find((p) => p.id === patternId);
    },
    getPatternsByTrack: (trackId) => {
      return get().patterns.filter((p) => p.trackId === trackId);
    },
  },
}));

