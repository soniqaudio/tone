"use client";

import { useMemo } from "react";
import { useMidiStore } from "@/core/stores/useMidiStore";

const MidiIcon = () => (
  <svg
    aria-hidden="true"
    className="w-3.5 h-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
  >
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <rect x="6" y="14" width="2" height="3" rx="0.5" />
    <rect x="11" y="14" width="2" height="3" rx="0.5" />
    <rect x="16" y="14" width="2" height="3" rx="0.5" />
    <path d="M6 9h12" />
  </svg>
);

export const TopBarMidiControls = () => {
  const midiAccessState = useMidiStore((s) => s.midiAccessState);
  const midiAccessError = useMidiStore((s) => s.midiAccessError);
  const inputs = useMidiStore((s) => s.devices);
  const selectedInputId = useMidiStore((s) => s.selectedInputId);
  const { selectInput, triggerMidiAccessRequest } = useMidiStore((s) => s.actions);

  const statusColor = useMemo(() => {
    if (midiAccessError || midiAccessState === "denied") return "var(--error)";
    if (midiAccessState === "granted" && inputs.length > 0) return "var(--primary)";
    if (midiAccessState === "requesting") return "var(--text-secondary)";
    return "var(--text-tertiary)";
  }, [midiAccessError, midiAccessState, inputs.length]);

  const handleConnectClick = () => {
    triggerMidiAccessRequest();
  };

  return (
    <div className="ml-auto flex items-center gap-2">
      <button
        type="button"
        onClick={handleConnectClick}
        disabled={midiAccessState === "requesting"}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-transparent transition-fast hover:border-subtle hover:bg-layer-1 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ color: statusColor }}
        title="Connect MIDI"
      >
        <MidiIcon />
      </button>
      {inputs.length > 0 && (
        <select
          value={selectedInputId || ""}
          onChange={(e) => selectInput(e.target.value || undefined)}
          className="rounded-full border border-subtle bg-layer-1/85 px-4 py-1.5 text-xs font-semibold text-primary shadow-layer-sm transition-fast hover:border-primary/40 focus-ring-primary"
          style={{
            color: selectedInputId ? "var(--text-primary)" : "var(--text-tertiary)",
            minWidth: "12rem",
          }}
        >
          <option value="">Choose MIDI</option>
          {inputs.map((input) => (
            <option key={input.id} value={input.id}>
              {input.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
