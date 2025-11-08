/**
 * Utility functions for generating unique IDs
 */

/**
 * Generates a unique ID with optional prefix
 * @param prefix - Optional prefix for the ID (e.g., 'clip', 'note', 'track')
 * @returns A unique ID string in format: prefix-timestamp-random or timestamp-random
 *
 * @example
 * generateId() // "1234567890-a1b2c3d4e5f6"
 * generateId('clip') // "clip-1234567890-a1b2c3d4e5f6"
 */
export const generateId = (prefix?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(16).slice(2);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
};

/**
 * Generates a unique clip ID with note number and timing information
 * @param noteNumber - MIDI note number
 * @param startMs - Start time in milliseconds
 * @returns A unique clip ID
 *
 * @example
 * generateClipId(60, 1000) // "clip-60-1000-a1b2c3d4e5f6"
 */
export const generateClipId = (noteNumber: number, startMs: number): string => {
  const random = Math.random().toString(16).slice(2);
  return `clip-${noteNumber}-${startMs}-${random}`;
};
