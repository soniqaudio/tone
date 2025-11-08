"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useStore } from "zustand";
import { audioEngine } from "@/core/audio/audioEngine";
import { PIANO_ROLL } from "@/core/constants/pianoRoll";
import { getRootNotes, getScaleNames } from "@/core/music/scales";
import { useMetronomeStore } from "@/core/stores/useMetronomeStore";
import { useMidiStore } from "@/core/stores/useMidiStore";
import { useMusicTheoryStore } from "@/core/stores/useMusicTheoryStore";
import { useTransportStore } from "@/core/stores/useTransportStore";
import { useUIStore } from "@/core/stores/useUIStore";
import type { WorkspaceView } from "@/core/stores/useViewStore";
import { useViewStore } from "@/core/stores/useViewStore";
import { TopBarMidiControls } from "./TopBarMidiControls";

const VIEW_OPTIONS: Array<{ id: WorkspaceView; label: string; shortcut: string }> = [
  { id: "playlist", label: "Playlist", shortcut: "F5" },
  { id: "piano-roll", label: "Piano Roll", shortcut: "F7" },
  { id: "mixer", label: "Mixer", shortcut: "F9" },
];

const formatTimecode = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  const centiseconds = Math.floor((ms % 1000) / 10)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}:${centiseconds}`;
};

interface SettingsToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

const SettingsToggle = ({ label, description, enabled, onToggle }: SettingsToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    className="flex w-full items-center justify-between rounded-md border border-white/5 px-3 py-2 text-left transition-colors hover:border-white/10 hover:bg-white/5"
    aria-pressed={enabled}
  >
    <div>
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
    <span
      className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
        enabled ? "bg-primary/70" : "bg-white/10"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </span>
  </button>
);

interface MenuItem {
  label: string;
  shortcut?: string;
  onSelect?: () => void;
}

const MenuDropdown = ({ label, items }: { label: string; items: MenuItem[] }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
          open ? "text-white" : "text-zinc-500 hover:text-white"
        }`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}
        <svg aria-hidden="true" className="h-3 w-3" viewBox="0 0 16 16" fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <div className="absolute left-0 mt-2 w-48 rounded-2xl border border-white/10 bg-[rgba(10,10,14,0.95)] p-2 shadow-layer-lg">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onSelect?.();
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              <span>{item.label}</span>
              {item.shortcut ? (
                <span className="text-xs text-zinc-500">{item.shortcut}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

interface TopBarProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
}

export default function TopBar({ isPlaying, onPlay, onStop }: TopBarProps) {
  const idPrefix = useId();
  const gridSelectId = `${idPrefix}-grid`;
  const keySelectId = `${idPrefix}-key`;
  const scaleSelectId = `${idPrefix}-scale`;
  const tempoInputId = `${idPrefix}-tempo`;

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

  const playheadMs = useTransportStore((state) => state.playheadMs);
  const setPlayheadMs = useTransportStore((state) => state.actions.setPlayheadMs);

  const metronomeEnabled = useMetronomeStore((state) => state.enabled);
  const toggleMetronome = useMetronomeStore((state) => state.actions.toggle);

  const undo = useStore(useMidiStore.temporal, (state) => state.undo);
  const redo = useStore(useMidiStore.temporal, (state) => state.redo);
  const canUndo = useStore(useMidiStore.temporal, (state) => state.pastStates.length > 0);
  const canRedo = useStore(useMidiStore.temporal, (state) => state.futureStates.length > 0);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (!settingsRef.current?.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [settingsOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (!cmdOrCtrl || e.key !== "z") return;
      e.preventDefault();
      if (e.shiftKey) {
        if (canRedo) redo();
        return;
      }
      if (canUndo) undo();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  const msPerBeat = useMemo(() => 60000 / Math.max(tempo, 1), [tempo]);
  const formattedTime = formatTimecode(playheadMs);

  const handleStop = () => onStop();
  const handlePlay = () => onPlay();
  const handleMetronomeToggle = () => {
    audioEngine.ensureMetronomeReady();
    toggleMetronome();
  };

  const controlBlock =
    "flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5";
  const iconButtonClass = (active = false) =>
    `flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
      active
        ? "border-white/25 bg-white/[0.14] text-white"
        : "border-white/12 bg-white/[0.08] text-white/80 hover:border-white/20 hover:bg-white/[0.12] hover:text-white"
    }`;

  const recordButtonClass = recordArm
    ? "flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/60 bg-red-500/20 text-red-100"
    : "flex h-9 w-9 items-center justify-center rounded-lg border border-white/12 bg-white/[0.08] text-white/80 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-100";

  const transportClusterClass =
    "flex items-center gap-1 rounded-xl border border-white/12 bg-white/[0.015] px-1.5 py-1";

  const settingsOptions = [
    {
      label: "Ghost notes",
      description: "Overlay notes from other tracks",
      enabled: showGhostNotes,
      onToggle: () => setShowGhostNotes(!showGhostNotes),
    },
    {
      label: "Sustain view",
      description: "Show pedal-extended notes",
      enabled: showSustainExtended,
      onToggle: () => toggleSustainExtended(),
    },
    {
      label: "Follow playhead",
      description: "Auto-scroll during playback",
      enabled: followPlayhead,
      onToggle: () => setPianoRollFollow(!followPlayhead),
    },
    {
      label: "Typing keyboard",
      description: "Play notes with QWERTY keys",
      enabled: computerInputEnabled,
      onToggle: () => setComputerInputEnabled(!computerInputEnabled),
    },
  ];

  const fileMenuItems: MenuItem[] = [
    { label: "New Project", shortcut: "⌘N" },
    { label: "Open", shortcut: "⌘O" },
    { label: "Save", shortcut: "⌘S" },
    { label: "Export", shortcut: "⇧⌘E" },
  ];

  const editMenuItems: MenuItem[] = [
    { label: "Cut", shortcut: "⌘X" },
    { label: "Copy", shortcut: "⌘C" },
    { label: "Paste", shortcut: "⌘V" },
    { label: "Undo", shortcut: "⌘Z", onSelect: () => undo() },
    { label: "Redo", shortcut: "⇧⌘Z", onSelect: () => redo() },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(6,6,9,0.92)] text-sm text-zinc-200 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        {/* LEFT: Logo + File/Edit */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white shadow-lg">
            tn
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white">tone</p>
            <p className="text-xs text-zinc-500">Untitled Project</p>
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 md:flex">
            <MenuDropdown label="File" items={fileMenuItems} />
            <div className="h-4 w-px bg-white/10" />
            <MenuDropdown label="Edit" items={editMenuItems} />
          </div>
        </div>

        {/* CENTER: Transport Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 sm:flex">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-500">
                BPM
              </span>
              <input
                id={tempoInputId}
                type="number"
                value={tempo}
                onChange={(event) => setTempo(Number(event.target.value))}
                className="w-16 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
              />
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-500">
                Time
              </span>
              <span className="rounded-lg border border-white/10 bg-white/[0.02] px-2 py-1 text-sm font-mono text-white">
                {formattedTime}
              </span>
            </div>
          </div>

          <div className={transportClusterClass}>
            <button type="button" onClick={handleStop} className={iconButtonClass()} title="Stop">
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="7" y="7" width="10" height="10" rx="1" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handlePlay}
              className={iconButtonClass(isPlaying)}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="8" y="6" width="3" height="12" rx="0.5" />
                  <rect x="13" y="6" width="3" height="12" rx="0.5" />
                </svg>
              ) : (
                <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={handleMetronomeToggle}
              className={iconButtonClass(metronomeEnabled)}
              title={metronomeEnabled ? "Metronome on" : "Metronome off"}
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 256 256"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M64.458 228.867c-.428 2.167 1.007 3.91 3.226 3.893l121.557-.938c2.21-.017 3.68-1.794 3.284-3.97l-11.838-64.913c-.397-2.175-1.626-2.393-2.747-.487l-9.156 15.582c-1.12 1.907-1.71 5.207-1.313 7.388l4.915 27.03c.395 2.175-1.072 3.937-3.288 3.937H88.611c-2.211 0-3.659-1.755-3.233-3.92L114.85 62.533l28.44-.49 11.786 44.43c.567 2.139 2.01 2.386 3.236.535l8.392-12.67c1.22-1.843 1.73-5.058 1.139-7.185l-9.596-34.5c-1.184-4.257-5.735-7.677-10.138-7.638l-39.391.349c-4.415.039-8.688 3.584-9.544 7.912L64.458 228.867z"
                />
                <path
                  fillRule="evenodd"
                  d="M118.116 198.935c-1.182 1.865-.347 3.377 1.867 3.377h12.392c2.214 0 4.968-1.524 6.143-3.39l64.55-102.463c1.18-1.871 3.906-3.697 6.076-4.074l9.581-1.667c2.177-.379 4.492-2.38 5.178-4.496l4.772-14.69c.683-2.104-.063-5.034-1.677-6.555L215.53 54.173c-1.609-1.517-4.482-1.862-6.4-.78l-11.799 6.655c-1.925 1.086-3.626 3.754-3.799 5.954l-.938 11.967c-.173 2.202-1.27 5.498-2.453 7.363l-72.026 113.603z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setRecordArm(!recordArm)}
              className={recordButtonClass}
              title={recordArm ? "Recording armed" : "Arm recording"}
            >
              <svg aria-hidden="true" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="5" />
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT: View Selector + Grid + Undo/Redo + Settings */}
        <div className="flex items-center gap-2">
          <div className={`${controlBlock} hidden lg:flex`}>
            {VIEW_OPTIONS.map((option) => {
              const isActive = activeView === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActiveView(option.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  aria-pressed={isActive}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="lg:hidden">
            <select
              value={activeView}
              onChange={(event) => setActiveView(event.target.value as WorkspaceView)}
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
            >
              {VIEW_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <select
            id={gridSelectId}
            value={gridResolutionId}
            onChange={(event) => setGridResolution(event.target.value)}
            className="h-9 min-w-[5.5rem] rounded-lg border border-white/12 bg-black/40 px-2.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
          >
            {PIANO_ROLL.GRID_RESOLUTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 rounded-lg border border-white/12 bg-white/[0.02] p-0.5">
            <button
              type="button"
              onClick={() => undo()}
              disabled={!canUndo}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-zinc-400 transition-colors hover:border-white/15 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              title="Undo (Cmd+Z)"
            >
              <svg
                aria-hidden="true"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
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
              className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-zinc-400 transition-colors hover:border-white/15 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              title="Redo (Cmd+Shift+Z)"
            >
              <svg
                aria-hidden="true"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>
          </div>

          <div className="relative" ref={settingsRef}>
            <button
              type="button"
              onClick={() => setSettingsOpen((prev) => !prev)}
              className={iconButtonClass(settingsOpen)}
              title="Session settings"
              aria-haspopup="true"
              aria-expanded={settingsOpen}
            >
              <span className="text-lg">⚙️</span>
            </button>
            {settingsOpen ? (
              <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-white/10 bg-[rgba(10,10,14,0.95)] p-4 shadow-layer-lg">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                  View Settings
                </p>
                <div className="space-y-2">
                  {settingsOptions.map((option) => (
                    <SettingsToggle key={option.label} {...option} />
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
                    Midi
                  </p>
                  <TopBarMidiControls className="w-full justify-between" />
                </div>
                <div className="mt-4 flex gap-2 text-xs text-zinc-500">
                  <label className="flex-1" htmlFor={keySelectId}>
                    Key
                    <select
                      id={keySelectId}
                      value={rootNote}
                      onChange={(event) => setRootNote(event.target.value)}
                      className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                    >
                      {getRootNotes().map((note) => (
                        <option key={note} value={note}>
                          {note}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex-1" htmlFor={scaleSelectId}>
                    Scale
                    <select
                      id={scaleSelectId}
                      value={scale}
                      onChange={(event) => setScale(event.target.value)}
                      className="mt-1 w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                    >
                      {getScaleNames().map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
