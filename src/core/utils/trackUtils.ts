/**
 * Utility functions for track management
 */

import { useTrackStore } from "@/core/stores/useTrackStore";

export const LEGACY_DEFAULT_TRACK_ID = "track-default";
export const FALLBACK_TRACK_ID = "__fallback-track__";

/**
 * Gets the active track ID or falls back to first track or default
 * @returns The active track ID
 *
 * This is a helper to avoid duplicating the track resolution logic
 * across multiple components and hooks.
 */
export const getActiveTrackId = (): string => {
  const { activeTrackId, tracks } = useTrackStore.getState();
  if (activeTrackId) {
    return activeTrackId;
  }
  return tracks[0]?.id ?? FALLBACK_TRACK_ID;
};

/**
 * Maps legacy hardcoded IDs (e.g., "track-default") to the current track id.
 */
export const resolveTrackId = (trackId: string): string => {
  const { tracks } = useTrackStore.getState();
  const firstTrackId = tracks[0]?.id;

  if (trackId === LEGACY_DEFAULT_TRACK_ID || trackId === FALLBACK_TRACK_ID) {
    return firstTrackId ?? trackId;
  }

  const exists = tracks.some((track) => track.id === trackId);
  if (exists || !firstTrackId) {
    return trackId;
  }

  // If the requested track no longer exists, fall back to the first track to avoid ghost selection
  return firstTrackId;
};
