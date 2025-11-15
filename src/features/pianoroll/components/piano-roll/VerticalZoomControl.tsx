"use client";

import { useCallback } from "react";
import { useUIStore } from "@/core/stores/useUIStore";

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
    <div className={`flex h-14 items-center justify-center ${className}`}>
      <input
        type="range"
        min={minHeight}
        max={maxHeight}
        step={0.1}
        value={pianoRollKeyHeight}
        onChange={handleChange}
        className="h-full w-3 cursor-pointer appearance-none bg-transparent [writing-mode:vertical-lr] [direction:rtl] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/15 [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-white/20 [&::-webkit-slider-runnable-track]:h-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:mt-[-4px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/15 [&::-moz-range-track]:border [&::-moz-range-track]:border-white/20 [&::-moz-range-track]:width-full [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-0"
        aria-label="Vertical zoom"
        title={`Key height: ${pianoRollKeyHeight.toFixed(1)}x`}
      />
    </div>
  );
}
