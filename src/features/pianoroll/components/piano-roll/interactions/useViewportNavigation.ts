import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback } from "react";

interface UseViewportNavigationProps {
  timelineContainerRef: React.RefObject<HTMLDivElement>;
  containerRef: React.RefObject<HTMLDivElement>;
  gridWidth: number;
  viewportWidth: number;
}

export const useViewportNavigation = ({
  timelineContainerRef,
  containerRef,
  gridWidth,
  viewportWidth,
}: UseViewportNavigationProps) => {
  // Handle dragging the viewport position indicator on timeline
  const handleViewportDragStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();

      const timelineRect = timelineContainerRef.current?.getBoundingClientRect();
      const container = containerRef.current;
      if (!timelineRect || !container) return;

      const startClientX = event.clientX;
      const startScrollLeft = container.scrollLeft;
      const width = timelineRect.width || 1;

      const handleMove = (moveEvent: PointerEvent) => {
        const deltaPx = moveEvent.clientX - startClientX;
        const deltaRatio = deltaPx / width;
        const deltaWorld = deltaRatio * gridWidth;
        const nextScroll = Math.max(
          0,
          Math.min(gridWidth - viewportWidth, startScrollLeft + deltaWorld),
        );
        container.scrollLeft = nextScroll;
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp, { once: true });
    },
    [timelineContainerRef, containerRef, gridWidth, viewportWidth],
  );

  return {
    handleViewportDragStart,
  };
};
