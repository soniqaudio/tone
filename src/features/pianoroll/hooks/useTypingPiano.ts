"use client";

import { useEffect, useMemo, useRef } from "react";
import { noteNameToMidi, SCALE_INTERVALS, type ScaleName } from "@/core/music/scales";

type Event = { type: "on" | "off"; note: number; velocity: number; time: number };

// Rows in physical left→right order
// German keyboard layout: yxcvbnm,.-  asdfghjklöä  qwertzuiopü  1234567890ß
// We'll use the common keys that work on both layouts
const ROW_BOTTOM = ["y", "x", "c", "v", "b", "n", "m", ",", ".", "-"]; // base octave 3
const ROW_HOME = ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"]; // base octave 4
const ROW_TOP = ["q", "w", "e", "r", "t", "z", "u", "i", "o", "p", "[", "]"]; // base octave 5
const ROW_NUM = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="]; // base octave 6

function buildMap(rootNote: string, scale: ScaleName) {
  const map = new Map<string, number>();

  const scaleIntervals = SCALE_INTERVALS[scale];

  const place = (row: string[], baseOctave: number) => {
    const rootMidi = noteNameToMidi(`${rootNote}${baseOctave}`);

    for (let i = 0; i < row.length; i++) {
      const scaleIndex = i % scaleIntervals.length;
      const octaveShift = Math.floor(i / scaleIntervals.length) * 12;
      const midiNote = rootMidi + scaleIntervals[scaleIndex] + octaveShift;
      map.set(row[i], midiNote);
    }
  };

  place(ROW_BOTTOM, 3); // y -> root note octave 3
  place(ROW_HOME, 4); // a -> root note octave 4
  place(ROW_TOP, 5); // q -> root note octave 5
  place(ROW_NUM, 6); // 1 -> root note octave 6

  return map;
}

export function useTypingPiano(
  enabled: boolean,
  onEvent: (e: Event) => void,
  velocity = 96,
  rootNote = "C",
  scale: ScaleName = "major",
) {
  const map = useMemo(() => buildMap(rootNote, scale), [rootNote, scale]);
  const down = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled) return;
    const isEditable = (target: EventTarget | null): target is HTMLElement => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }
      return (
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable
      );
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      // Skip piano input when cmd/ctrl is held (for shortcuts like cmd+c, cmd+v, etc.)
      if (e.metaKey || e.ctrlKey) return;
      const k = e.key.toLowerCase();
      if (down.current.has(k)) return;
      const note = map.get(k);
      if (note == null) return;
      down.current.add(k);
      onEvent({ type: "on", note, velocity, time: performance.now() });
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      // Skip piano input when cmd/ctrl is held
      if (e.metaKey || e.ctrlKey) return;
      const k = e.key.toLowerCase();
      if (!down.current.has(k)) return;
      down.current.delete(k);
      const note = map.get(k);
      if (note == null) return;
      onEvent({ type: "off", note, velocity: 0, time: performance.now() });
      e.preventDefault();
    };

    const captureOptions: AddEventListenerOptions = { capture: true };

    window.addEventListener("keydown", onKeyDown, captureOptions);
    window.addEventListener("keyup", onKeyUp, captureOptions);
    return () => {
      window.removeEventListener("keydown", onKeyDown, captureOptions);
      window.removeEventListener("keyup", onKeyUp, captureOptions);
    };
  }, [enabled, onEvent, map, velocity]);
}
