"use client";

import { useCallback } from "react";
import { useUIStore } from "@/core/stores/useUIStore";
import { cn } from "@/lib/utils";

interface VerticalZoomControlProps {
  className?: string;
}

export function VerticalZoomControl({ className }: VerticalZoomControlProps) {
  const pianoRollKeyHeight = useUIStore((state) => state.pianoRollKeyHeight);
  const setPianoRollKeyHeight = useUIStore((state) => state.actions.setPianoRollKeyHeight);

  const minHeight = 0.5;
  const maxHeight = 3.0;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);
      setPianoRollKeyHeight(value);
    },
    [setPianoRollKeyHeight],
  );

  return (
    <div className={cn("flex h-full items-center justify-center", className)}>
      <input
        type="range"
        min={minHeight}
        max={maxHeight}
        step={0.1}
        value={pianoRollKeyHeight}
        onChange={handleChange}
        className="h-full w-2 cursor-pointer appearance-none bg-transparent [writing-mode:vertical-lr] [direction:rtl] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-muted [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-border [&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-webkit-slider-thumb]:shadow-layer-sm [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:mt-[-4px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-muted [&::-moz-range-track]:border [&::-moz-range-track]:border-border [&::-moz-range-track]:h-full [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-2.5 [&::-moz-range-thumb]:w-2.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-foreground [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:shadow-layer-sm"
        aria-label="Vertical zoom"
        title={`Key height: ${pianoRollKeyHeight.toFixed(1)}x`}
      />
    </div>
  );
}
