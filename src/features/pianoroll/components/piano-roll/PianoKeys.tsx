"use client";

import { useCallback, useRef } from "react";
import { audioEngine } from "@/core/audio/audioEngine";
import { getActiveTrackId } from "@/core/utils/trackUtils";

interface PianoKeysProps {
  pianoKeys: Array<{ note: string; isBlack: boolean; midi: number }>;
  keyHeight: number;
  activeNotes?: Set<number>;
}

export const PianoKeys = ({ pianoKeys, keyHeight, activeNotes }: PianoKeysProps) => {
  const timeoutRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const handleKeyClick = useCallback((midiNote: number) => {
    const trackId = getActiveTrackId();

    // Clear any existing timeout for this note
    const existingTimeout = timeoutRefs.current.get(midiNote);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      audioEngine.noteOff(midiNote, trackId);
      timeoutRefs.current.delete(midiNote);
    }

    // Play audio
    audioEngine.resume().catch(() => undefined);
    audioEngine.noteOn(midiNote, 80, trackId);

    // Release note after short duration
    const timeout = setTimeout(() => {
      audioEngine.noteOff(midiNote, trackId);
      timeoutRefs.current.delete(midiNote);
    }, 300);

    timeoutRefs.current.set(midiNote, timeout);
  }, []);
  return (
    <div className="w-20 border-r border-subtle bg-layer-2/90 backdrop-blur">
      <div className="relative" style={{ height: `${pianoKeys.length * keyHeight}px` }}>
        {pianoKeys.map((key, index) => {
          const isActive = activeNotes?.has(key.midi);
          const baseClasses = `absolute flex w-full items-center justify-end pr-3 uppercase transition-fast`;
          const toneClasses = key.isBlack
            ? "bg-[linear-gradient(90deg,rgba(0,0,0,0.65),rgba(0,0,0,0.25))] text-[hsla(0,0%,85%,0.9)] border-b border-medium"
            : "bg-[linear-gradient(90deg,rgba(255,255,255,0.92),rgba(222,222,222,0.55))] text-[rgba(34,34,34,0.85)] border-b border-subtle";
          const stateClasses = isActive
            ? "bg-[var(--primary-bg)] text-[var(--primary)] shadow-glow-primary"
            : "hover:bg-surface-hover";
          return (
            <div
              key={key.midi}
              className={`${baseClasses} ${toneClasses} ${stateClasses} cursor-pointer`}
              style={{ top: `${index * keyHeight}px`, height: `${keyHeight}px` }}
              onClick={() => handleKeyClick(key.midi)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span className="select-none text-[10px] font-medium mix-blend-normal">
                {key.note}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
