"use client";

import { useEffect, useMemo, useId } from "react";
import { useStore } from "zustand";
import { audioEngine } from "@/core/audio/audioEngine";
import { PIANO_ROLL } from "@/core/constants/pianoRoll";
import { getRootNotes, getScaleNames } from "@/core/music/scales";
import { useMetronomeStore } from "@/core/stores/useMetronomeStore";
import { useMidiStore } from "@/core/stores/useMidiStore";
import { useMusicTheoryStore } from "@/core/stores/useMusicTheoryStore";
import { useUIStore } from "@/core/stores/useUIStore";
import type { WorkspaceView } from "@/core/stores/useViewStore";
import { useViewStore } from "@/core/stores/useViewStore";
import { TopBarMidiControls } from "./TopBarMidiControls";

const VIEW_OPTIONS: Array<{ id: WorkspaceView; label: string }> = [
  { id: "piano-roll", label: "Piano Roll" },
  { id: "playlist", label: "Playlist" },
  { id: "mixer", label: "Mixer" },
];

interface TopBarProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export default function TopBar({ isPlaying, onPlay, onStop }: TopBarProps) {
  const gridSelectId = useId();
  const tempo = useMusicTheoryStore((state) => state.tempo);
  const setTempo = useMusicTheoryStore((state) => state.actions.setTempo);
  const rootNote = useMusicTheoryStore((state) => state.rootNote);
  const setRootNote = useMusicTheoryStore((state) => state.actions.setRootNote);
  const scale = useMusicTheoryStore((state) => state.scale);
  const setScale = useMusicTheoryStore((state) => state.actions.setScale);
  const recordArm = useMidiStore((state) => state.recordArm);
  const setRecordArm = useMidiStore((state) => state.actions.setRecordArm);
  const computerInputEnabled = useMidiStore((state) => state.computerInputEnabled);
  const setComputerInputEnabled = useMidiStore((state) => state.actions.setComputerInputEnabled);
  const showGhostNotes = useUIStore((state) => state.showGhostNotes);
  const setShowGhostNotes = useUIStore((state) => state.actions.setShowGhostNotes);
  const followPlayhead = useUIStore((state) => state.pianoRollFollowPlayhead);
  const setPianoRollFollow = useUIStore((state) => state.actions.setPianoRollFollow);
  const showSustainExtended = useUIStore((state) => state.showSustainExtended);
  const toggleSustainExtended = useUIStore((state) => state.actions.toggleSustainExtended);
  const gridResolutionId = useUIStore((state) => state.pianoRollGridResolution);
  const setGridResolution = useUIStore((state) => state.actions.setPianoRollGridResolution);
  const activeView = useViewStore((state) => state.activeView);
  const setActiveView = useViewStore((state) => state.actions.setActiveView);

  const metronomeEnabled = useMetronomeStore((state) => state.enabled);
  const toggleMetronome = useMetronomeStore((state) => state.actions.toggle);

  const undo = useStore(useMidiStore.temporal, (state) => state.undo);
  const redo = useStore(useMidiStore.temporal, (state) => state.redo);
  const canUndo = useStore(useMidiStore.temporal, (state) => state.pastStates.length > 0);
  const canRedo = useStore(useMidiStore.temporal, (state) => state.futureStates.length > 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          if (canRedo) redo();
        } else {
          e.preventDefault();
          if (canUndo) undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const ghostIcon = useMemo(
    () => (
      <svg
        aria-hidden="true"
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
      >
        <path d="M2 12s3.2-6 10-6 10 6 10 6-3.2 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
    [],
  );

  const pedalIcon = useMemo(
    () => (
      <svg
        aria-hidden="true"
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
      >
        <path d="M7 18h10" strokeLinecap="round" />
        <path
          d="M10 5.5c2 0 3.8 1.5 4.3 3.6l1 3.7H8.2l1-3.3c.3-1.3.4-3 .8-4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    [],
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-6 border-b border-subtle bg-glass-dark px-8 text-secondary shadow-layer-md relative">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px highlight-top-line" />

      <div className="flex flex-1 items-center gap-4">
        <nav className="flex items-center gap-1 rounded-full border border-subtle bg-layer-1/80 px-1.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-tertiary shadow-layer-sm">
          {VIEW_OPTIONS.map(({ id, label }) => {
            const isActive = activeView === id;
            return (
              <button
                type="button"
                key={id}
                onClick={() => setActiveView(id)}
                className={`relative rounded-full px-3 py-1 transition-fast ${
                  isActive
                    ? "bg-primary/20 text-primary shadow-glow-primary"
                    : "text-secondary hover:bg-layer-2"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
        <div className="hidden min-[960px]:flex h-10 items-center gap-2 rounded-lg border border-subtle bg-layer-1/75 px-2.5 text-xs font-medium text-secondary floating-shadow">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase text-tertiary">Key</span>
            <select
              value={rootNote}
              onChange={(e) => setRootNote(e.target.value)}
              className="w-14 appearance-none rounded bg-transparent px-1.5 py-0.5 text-sm text-primary outline-none focus:outline-none"
            >
              {getRootNotes().map((note) => (
                <option key={note} value={note}>
                  {note}
                </option>
              ))}
            </select>
          </div>
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase text-tertiary">Scale</span>
            <select
              value={scale}
              onChange={(e) => setScale(e.target.value as typeof scale)}
              className="max-w-[100px] appearance-none truncate rounded bg-transparent px-1.5 py-0.5 text-sm text-primary outline-none focus:outline-none"
            >
              {getScaleNames().map((scaleName) => (
                <option key={scaleName} value={scaleName}>
                  {scaleName.charAt(0).toUpperCase() + scaleName.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="h-4 w-px bg-[var(--border-subtle)]" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase text-tertiary">BPM</span>
            <input
              type="number"
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              min={20}
              max={300}
              className="w-14 rounded bg-layer-2 px-2 py-0.5 text-center text-sm font-semibold text-primary shadow-layer-inset outline-none focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 min-[960px]:hidden text-[11px] text-tertiary">
          <span className="uppercase tracking-[0.3em] text-secondary">Key</span>
          <span className="text-primary">{rootNote}</span>
          <span className="text-tertiary">•</span>
          <span className="uppercase tracking-[0.3em] text-secondary">Scale</span>
          <span className="text-primary">{scale}</span>
          <span className="text-tertiary">•</span>
          <span className="uppercase tracking-[0.3em] text-secondary">BPM</span>
          <span className="text-primary">{tempo}</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-subtle bg-layer-1/80 px-1.5 py-1 shadow-layer-sm">
          <button
            type="button"
            onClick={onPlay}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-fast ${
              isPlaying
                ? "bg-primary/15 text-primary shadow-glow-primary"
                : "text-secondary hover:bg-layer-2"
            }`}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="ml-0.5 h-3.5 w-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onStop}
            className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-fast hover:bg-layer-2"
            title="Stop"
          >
            <svg aria-hidden="true" className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              audioEngine.ensureMetronomeReady();
              toggleMetronome();
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-fast ${
              metronomeEnabled
                ? "bg-primary/15 text-primary shadow-glow-primary"
                : "text-secondary hover:bg-layer-2"
            }`}
            title={metronomeEnabled ? "Metronome on" : "Metronome off"}
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v3m0 12v3m-9-9h3m12 0h3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setRecordArm(!recordArm)}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-fast ${
              recordArm
                ? "bg-[hsla(0,84%,60%,0.14)] text-[hsl(0,84%,60%)] shadow-[0_0_0_1px_hsla(0,84%,60%,0.45),0_10px_20px_-12px_hsla(0,84%,45%,0.55)]"
                : "text-secondary hover:bg-layer-2"
            }`}
            title={recordArm ? "Recording armed" : "Arm recording"}
          >
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="5" />
            </svg>
          </button>
        </div>

        <TopBarMidiControls />

        <div className="hidden items-center gap-2 min-[960px]:flex">
          <label
            className="text-[10px] font-semibold uppercase tracking-[0.3em] text-tertiary"
            htmlFor={gridSelectId}
          >
            Grid
          </label>
          <select
            id={gridSelectId}
            value={gridResolutionId}
            onChange={(event) => setGridResolution(event.target.value)}
            className="rounded-full border border-subtle bg-layer-1/85 px-3 py-1 text-xs font-semibold text-primary shadow-layer-sm transition-fast hover:border-primary/40 focus-ring-primary"
            title="Grid resolution"
          >
            {PIANO_ROLL.GRID_RESOLUTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setComputerInputEnabled(!computerInputEnabled)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-fast ${
            computerInputEnabled
              ? "bg-primary/15 text-primary shadow-glow-primary"
              : "text-secondary hover:bg-layer-2"
          }`}
          title={computerInputEnabled ? "Typing keyboard on" : "Enable typing keyboard"}
        >
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path
              d="M7 9h1M11 9h1M15 9h1M5 13h14M5 17h3M10 17h3M15 17h4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          type="button"
          onClick={toggleSustainExtended}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-transparent transition-fast ${
            showSustainExtended
              ? "border-primary/40 bg-[var(--primary-bg)] text-primary shadow-glow-primary"
              : "text-tertiary hover:border-subtle hover:bg-layer-1"
          }`}
          title={showSustainExtended ? "Showing pedal-extended notes" : "Showing raw key releases"}
        >
          {pedalIcon}
        </button>

        <button
          type="button"
          onClick={() => setShowGhostNotes(!showGhostNotes)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-transparent transition-fast ${
            showGhostNotes
              ? "border-primary/40 bg-[var(--primary-bg)] text-primary shadow-glow-primary"
              : "text-tertiary hover:border-subtle hover:bg-layer-1"
          }`}
          title="Ghost notes"
        >
          {ghostIcon}
        </button>
        <select
          value={gridResolutionId}
          onChange={(event) => setGridResolution(event.target.value)}
          className="min-[960px]:hidden rounded-full border border-subtle bg-layer-1/80 px-2.5 py-1 text-[11px] font-semibold text-primary shadow-layer-sm transition-fast hover:border-primary/40 focus-ring-primary"
          title="Grid resolution"
        >
          {PIANO_ROLL.GRID_RESOLUTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setPianoRollFollow(!followPlayhead)}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-transparent transition-fast ${
            followPlayhead
              ? "border-primary/40 bg-[var(--primary-bg)] text-primary shadow-glow-primary"
              : "text-tertiary hover:border-subtle hover:bg-layer-1"
          }`}
          title={followPlayhead ? "Disable playhead follow" : "Enable playhead follow"}
        >
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
          >
            <path
              d="M3 12s3.5-6.5 9-6.5 9 6.5 9 6.5-3.5 6.5-9 6.5-9-6.5-9-6.5Z"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="2.6" />
            <path d="M12 7v2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => undo()}
          disabled={!canUndo}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-secondary transition-fast hover:border-subtle hover:bg-layer-1 disabled:cursor-not-allowed disabled:opacity-30 ${
            canUndo ? "" : "text-tertiary"
          }`}
          title="Undo"
        >
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => redo()}
          disabled={!canRedo}
          className={`flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-secondary transition-fast hover:border-subtle hover:bg-layer-1 disabled:cursor-not-allowed disabled:opacity-30 ${
            canRedo ? "" : "text-tertiary"
          }`}
          title="Redo"
        >
          <svg
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
