"use client";

import { useCallback, useRef } from "react";
import { useUIStore } from "@/core/stores/useUIStore";

export function ResizableDivider() {
  const isDraggingRef = useRef(false);
  const sidebarWidth = useUIStore((state) => state.sidebarWidth);
  const setSidebarWidth = useUIStore((state) => state.actions.setSidebarWidth);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      isDraggingRef.current = true;
      const startX = event.clientX;
      const startWidth = sidebarWidth;

      const handleMove = (moveEvent: PointerEvent) => {
        if (!isDraggingRef.current) return;
        const deltaX = moveEvent.clientX - startX;
        const newWidth = startWidth + deltaX;
        setSidebarWidth(newWidth);
      };

      const handleUp = () => {
        isDraggingRef.current = false;
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp, { once: true });

      // Capture pointer to this element
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
    },
    [sidebarWidth, setSidebarWidth],
  );

  return (
    <div
      onPointerDown={handlePointerDown}
      className="group relative z-20 w-1 cursor-col-resize bg-transparent transition-colors hover:bg-white/20 active:bg-white/30"
      role="separator"
      aria-label="Resize sidebar"
      aria-orientation="vertical"
    >
      <div className="absolute inset-y-0 left-1/2 w-1 -translate-x-1/2" />
    </div>
  );
}

