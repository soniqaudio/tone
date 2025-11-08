import { useCallback } from "react";
import { PIANO_ROLL } from "@/core/constants";
import type { MidiNoteClip } from "@/core/midi/types";
import { clientToLocalRect } from "../lib/coords";

interface UseGridCoordinatesProps {
  gridContainerRef: React.RefObject<HTMLDivElement>;
  scrollLeft: number;
  pixelsPerBeat: number;
  msPerBeat: number;
  keyHeight: number;
  pianoKeys: Array<{ note: string; isBlack: boolean; midi: number }>;
  gridWidth: number;
  noteToIndex: Map<string, number>;
}

export interface ClipRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const useGridCoordinates = ({
  gridContainerRef,
  scrollLeft,
  pixelsPerBeat,
  msPerBeat,
  keyHeight,
  pianoKeys,
  gridWidth,
  noteToIndex,
}: UseGridCoordinatesProps) => {
  // Convert client coordinates to world coordinates
  const clientToWorld = useCallback(
    (clientX: number, clientY: number) => {
      const gridRect = gridContainerRef.current?.getBoundingClientRect();
      if (!gridRect) return { x: 0, y: 0 };

      const { localX, localY } = clientToLocalRect(clientX, clientY, gridRect);
      const worldX = localX + scrollLeft;
      const worldY = localY;

      return { x: worldX, y: worldY };
    },
    [gridContainerRef, scrollLeft],
  );

  // Convert world X coordinate to milliseconds
  const worldToMs = useCallback(
    (worldX: number) => {
      const clampedX = Math.max(0, Math.min(gridWidth, worldX));
      const beats = clampedX / pixelsPerBeat;
      return beats * msPerBeat;
    },
    [gridWidth, pixelsPerBeat, msPerBeat],
  );

  // Convert world Y coordinate to note index
  const worldToNoteIndex = useCallback(
    (worldY: number) => {
      const index = Math.floor(worldY / keyHeight);
      return Math.max(0, Math.min(pianoKeys.length - 1, index));
    },
    [keyHeight, pianoKeys.length],
  );

  // Get note number from world Y coordinate
  const worldToNoteNumber = useCallback(
    (worldY: number) => {
      const index = worldToNoteIndex(worldY);
      return pianoKeys[index]?.midi ?? 60;
    },
    [worldToNoteIndex, pianoKeys],
  );

  // Get clip rectangle in pixel coordinates
  const getClipRectPx = useCallback(
    (clip: MidiNoteClip): ClipRect | null => {
      const keyIdx = noteToIndex.get(clip.noteName);
      if (keyIdx === undefined) return null;

      const left = (clip.start / msPerBeat) * pixelsPerBeat;
      const right = ((clip.start + clip.duration) / msPerBeat) * pixelsPerBeat;
      const top = keyIdx * keyHeight;
      const bottom = top + keyHeight;

      return { left, right, top, bottom };
    },
    [noteToIndex, msPerBeat, pixelsPerBeat, keyHeight],
  );

  // Check if a point is near the right edge of a clip
  const isNearRightEdge = useCallback((worldX: number, clipRect: ClipRect) => {
    const distanceToRightEdge = Math.abs(worldX - clipRect.right);
    return (
      distanceToRightEdge <= PIANO_ROLL.RESIZE_HANDLE_WIDTH &&
      worldX >= clipRect.left &&
      worldX <= clipRect.right + PIANO_ROLL.RESIZE_HANDLE_WIDTH
    );
  }, []);

  // Check if a point is inside a clip body (not near edges)
  const isInsideClipBody = useCallback((worldX: number, worldY: number, clipRect: ClipRect) => {
    return (
      worldX >= clipRect.left &&
      worldX <= clipRect.right &&
      worldY >= clipRect.top &&
      worldY <= clipRect.bottom
    );
  }, []);

  return {
    clientToWorld,
    worldToMs,
    worldToNoteIndex,
    worldToNoteNumber,
    getClipRectPx,
    isNearRightEdge,
    isInsideClipBody,
  };
};
