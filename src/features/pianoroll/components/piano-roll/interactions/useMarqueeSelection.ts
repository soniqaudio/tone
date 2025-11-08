import { useCallback, useEffect, useRef, useState } from "react";
import type { MidiNoteClip } from "@/core/midi/types";
import type { ClipRect } from "../hooks/useGridCoordinates";

interface UseMarqueeSelectionProps {
  clips: MidiNoteClip[];
  gridContainerRef: React.RefObject<HTMLDivElement>;
  scrollLeft: number;
  setSelectedClipIds: (ids: string[]) => void;
  getClipRectPx: (clip: MidiNoteClip) => ClipRect | null;
  onMarqueeStart?: () => void;
  onMarqueeEnd?: () => void;
}

export interface SelectionRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const useMarqueeSelection = ({
  clips,
  gridContainerRef,
  scrollLeft,
  setSelectedClipIds,
  getClipRectPx,
  onMarqueeStart,
  onMarqueeEnd,
}: UseMarqueeSelectionProps) => {
  const marqueeRef = useRef<SelectionRect | null>(null);
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const clipsRef = useRef(clips);

  // Keep clips ref up to date
  useEffect(() => {
    clipsRef.current = clips;
  }, [clips]);

  // Handle pointer move during marquee selection
  const handleMarqueeMove = useCallback(
    (event: PointerEvent) => {
      if (!marqueeRef.current) return;

      const gridRect = gridContainerRef.current?.getBoundingClientRect();
      if (!gridRect) return;

      const localX = event.clientX - gridRect.left;
      const localY = event.clientY - gridRect.top;
      const worldX = localX + scrollLeft;
      const worldY = localY;

      marqueeRef.current.x1 = worldX;
      marqueeRef.current.y1 = worldY;
      setSelectionRect({ ...marqueeRef.current });
    },
    [gridContainerRef, scrollLeft],
  );

  // Select clips that intersect with marquee rectangle
  const selectIntersectingClips = useCallback(() => {
    if (!marqueeRef.current) return;

    const { x0, y0, x1, y1 } = marqueeRef.current;
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    const selectedIds: string[] = [];
    const currentClips = clipsRef.current ?? [];

    for (const clip of currentClips) {
      const rect = getClipRectPx(clip);
      if (!rect) continue;

      // Check if rectangles intersect
      const intersects = !(
        rect.right < minX ||
        rect.left > maxX ||
        rect.bottom < minY ||
        rect.top > maxY
      );

      if (intersects) {
        selectedIds.push(clip.id);
      }
    }

    setSelectedClipIds(selectedIds);
  }, [getClipRectPx, setSelectedClipIds]);

  // Handle pointer up during marquee selection
  const handleMarqueeUp = useCallback(() => {
    selectIntersectingClips();
    setSelectionRect(null);
    marqueeRef.current = null;
    onMarqueeEnd?.();
    window.removeEventListener("pointermove", handleMarqueeMove);
    window.removeEventListener("pointerup", handleMarqueeUp);
  }, [handleMarqueeMove, selectIntersectingClips, onMarqueeEnd]);

  // Start marquee selection
  const startMarquee = useCallback(
    (worldX: number, worldY: number) => {
      marqueeRef.current = { x0: worldX, y0: worldY, x1: worldX, y1: worldY };
      setSelectionRect(marqueeRef.current);
      window.addEventListener("pointermove", handleMarqueeMove, true);
      window.addEventListener("pointerup", handleMarqueeUp, true);
      onMarqueeStart?.();
    },
    [handleMarqueeMove, handleMarqueeUp, onMarqueeStart],
  );

  // Cancel marquee (cleanup)
  const cancelMarquee = useCallback(() => {
    if (marqueeRef.current) {
      window.removeEventListener("pointermove", handleMarqueeMove);
      window.removeEventListener("pointerup", handleMarqueeUp);
      marqueeRef.current = null;
      setSelectionRect(null);
      onMarqueeEnd?.();
    }
  }, [handleMarqueeMove, handleMarqueeUp, onMarqueeEnd]);

  const isMarqueeActive = useCallback(() => marqueeRef.current !== null, []);

  return {
    startMarquee,
    selectionRect,
    isMarqueeActive,
    cancelMarquee,
  };
};
