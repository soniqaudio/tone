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
  const range = maxHeight - minHeight;
  const percentage = ((pianoRollKeyHeight - minHeight) / range) * 100;

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(event.target.value);
      setPianoRollKeyHeight(value);
    },
    [setPianoRollKeyHeight],
  );

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <input
        type="range"
        min={minHeight}
        max={maxHeight}
        step={0.1}
        value={pianoRollKeyHeight}
        onChange={handleChange}
        className="h-full w-2 cursor-pointer appearance-none bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white/60 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white/60 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0"
        style={{
          background: `linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.3) ${percentage}%, rgba(255,255,255,0.1) ${percentage}%, rgba(255,255,255,0.1) 100%)`,
          writingMode: "vertical-lr",
          direction: "rtl",
        }}
        aria-label="Vertical zoom"
        title={`Key height: ${pianoRollKeyHeight.toFixed(1)}x`}
      />
    </div>
  );
}

