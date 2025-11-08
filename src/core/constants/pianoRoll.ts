/**
 * Piano Roll Constants
 *
 * All magic numbers related to the piano roll UI and interactions.
 * Centralizing these makes it easy to adjust the feel of the piano roll.
 */

export const PIANO_ROLL = {
  // Grid dimensions
  PIXELS_PER_BEAT: 64,
  KEY_HEIGHT: 16,
  NOTE_PADDING: 2,
  MIN_GRID_WIDTH: 2048,

  // Snap & quantization
  DEFAULT_GRID_RESOLUTION_ID: "1/16",
  GRID_RESOLUTIONS: [
    { id: "1/4", label: "1/4", subdivisionsPerBeat: 1 },
    { id: "1/8", label: "1/8", subdivisionsPerBeat: 2 },
    { id: "1/8T", label: "1/8T", subdivisionsPerBeat: 3 },
    { id: "1/16", label: "1/16", subdivisionsPerBeat: 4 },
    { id: "1/16T", label: "1/16T", subdivisionsPerBeat: 6 },
    { id: "1/32", label: "1/32", subdivisionsPerBeat: 8 },
    { id: "1/32T", label: "1/32T", subdivisionsPerBeat: 12 },
    { id: "1/64", label: "1/64", subdivisionsPerBeat: 16 },
  ] as const,
  DEFAULT_DURATION_BEATS: 1.0, // Quarter note

  // Interaction thresholds
  RESIZE_HANDLE_WIDTH: 8, // Pixels from edge to trigger resize
  DOUBLE_CLICK_THRESHOLD_MS: 320, // Max time between clicks to be considered double-click

  // Viewport & scrolling
  VIEWPORT_BUFFER_RATIO: 1.2, // 20% buffer for smoother scrolling (10% each side)

  // Audio feedback
  NOTE_PREVIEW_DURATION_MS: 300, // How long to play note when created
} as const;

// Helper functions for common conversions
export const pianoRollHelpers = {
  beatsToPixels: (beats: number) => beats * PIANO_ROLL.PIXELS_PER_BEAT,
  pixelsToBeats: (pixels: number) => pixels / PIANO_ROLL.PIXELS_PER_BEAT,
  beatsToMs: (beats: number, tempo: number) => beats * (60000 / tempo),
  msToBeats: (ms: number, tempo: number) => ms / (60000 / tempo),
} as const;
