import { useCallback } from "react";
import { useUIStore } from "@/core/stores/useUIStore";

interface UseCursorManagementProps {
  containerRef: React.RefObject<HTMLDivElement>;
  worldToMs: (worldX: number) => number;
  worldToNoteNumber: (worldY: number) => number;
  findRightEdgeHit: (worldX: number, worldY: number) => unknown;
  isIdle: () => boolean;
}

export const useCursorManagement = ({
  containerRef,
  worldToMs,
  worldToNoteNumber,
  findRightEdgeHit,
  isIdle,
}: UseCursorManagementProps) => {
  // Handle pointer move to update cursor and pointer position
  const handleGridPointerMove = useCallback(
    (worldX: number, worldY: number) => {
      const container = containerRef.current;
      if (!container) return;

      // Always update pointer position in UI store (needed for paste)
      const pointerMs = worldToMs(worldX);
      const pointerNoteNumber = worldToNoteNumber(worldY);
      useUIStore.getState().actions.setPianoRollPointer({
        ms: pointerMs,
        noteNumber: pointerNoteNumber,
      });

      // Update cursor based on hover position (only when idle)
      if (isIdle()) {
        const edgeHit = findRightEdgeHit(worldX, worldY);
        container.style.cursor = edgeHit ? "ew-resize" : "crosshair";
      }
    },
    [containerRef, worldToMs, worldToNoteNumber, findRightEdgeHit, isIdle],
  );

  return {
    handleGridPointerMove,
  };
};
