# Piano Roll Extraction Plan

## Goal
Create a standalone `soniqaudio/piano-roll` package that reuses the existing implementation but exposes a clean API so other projects (or future soniqaudio apps) can drop in the piano roll without dragging the entire DAW.

## Why reuse the current implementation?
- Canvas layering, coordinate transforms, and gesture handling are already solved here. Rewriting from scratch would reintroduce the same bugs we just fixed.
- The codebase is modular: derived state, interactions, and rendering layers are already separated, making it easier to tease out dependencies.

## High-Level Steps
1. **Fork / new repo**: create `soniqaudio/piano-roll` and copy `src/features/pianoroll` plus required helpers (`core/constants/pianoRoll`, MIDI types, clipboard actions, etc.).
2. **Define shared types**: publish a TypeScript interface package (`MidiNoteClip`, `ClipboardItem`, `TransportState`, `PianoRollUIState`). This can live in `soniqaudio/midi-engine` or a shared `soniqaudio/types` repo.
3. **Invert dependencies**: replace direct imports from app-specific Zustand stores with injected props or context. The standalone component should accept data/actions like `clips`, `onAddClip`, `onPaste`, `transport`, `uiState`.
4. **Provide defaults**: offer optional hooks (e.g., `useDefaultMidiStore`) so the standalone repo still works out of the box, but allow host apps to bring their own engines.
5. **Build demo/story**: include a minimal Next.js/Vite example that uses mock data to showcase the component and act as a regression test.
6. **Document integration**: write a README explaining required props, data shapes, and how to wire the component to external engines (midi/audio/music theory).

## Proposed Interfaces
```ts
interface MidiNoteClip {
  id: string;
  start: number;      // ms
  duration: number;   // ms
  noteNumber: number; // 0-127
  noteName: string;
  velocity?: number;
  trackId: string;
}

interface PianoRollMidiAPI {
  clips: MidiNoteClip[];
  ghostClips?: MidiNoteClip[];
  selectedClipIds: string[];
  addClip(clip: MidiNoteClip): void;
  removeClip(id: string): void;
  updateClipDuration(id: string, duration: number): void;
  updateClips(updates: Array<{ id: string; start: number; noteNumber: number }>);
  setSelectedClipIds(ids: string[]): void;
  copySelectedClips(): void;
  cutSelectedClips(): void;
  pasteClipsAt(startMs: number, noteNumber: number): void;
}

interface PianoRollTransportAPI {
  playheadMs: number;
  isPlaying: boolean;
  setPlayheadMs(ms: number): void;
  pause(): void;
}

interface PianoRollUIState {
  zoom: number;
  keyHeight: number;
  scrollLeft: number;
  scrollTop: number;
  setZoom(value: number): void;
  setKeyHeight(value: number): void;
  setScroll(position: { left: number; top: number }): void;
}

interface PianoRollProps {
  midi: PianoRollMidiAPI;
  transport: PianoRollTransportAPI;
  ui: PianoRollUIState;
  tempo: number;
  gridResolutionId: string;
  showGhostNotes?: boolean;
  showVelocityLane?: boolean;
}
```
Host apps pass objects implementing these interfaces; the piano roll never touches global stores directly.

## Decoupling Strategy
- **Replace store imports**: search for `useMidiStore`, `useUIStore`, etc., and swap them for props/context accesses. For example, `usePianoRollInteractions` should call `props.midi.addClip` instead of `useMidiStore(...).actions.addClip`.
- **Context wrapper**: Optionally expose a `<PianoRollProvider>` that takes the API objects and makes them available via React context to internal hooks (so we don’t thread props through every function).
- **Optional features via props**: enable/disable ghost notes, velocity lane, and audio preview through props. If a host doesn’t supply `ghostClips`, the layer simply doesn’t render.

## Demo & Testing
- Create a `demo` folder (Next.js or Vite) inside the repo with mocked stores (simple React state) to showcase editing, marquee selection, and playback cursor.
- Add Storybook or Playroom stories for key components (grid, notes layer, overlay) to ease regression testing.

## Integration with other soniqaudio repos
- `midi-engine`: provides the real implementations of the MIDI API (copy/paste, derivation, undo/redo). The piano roll imports the interfaces, not the implementations.
- `audio-engine`: optional hook for auditioning notes. Expose a prop like `onPreviewNote(noteNumber)` so hosts can wire audio engines without hard dependencies.
- `music-theory`: utility package for note naming, scales—already shared via `midiNumberToName`, etc.

## Migration Checklist for Future Agent
1. Read `docs/piano-roll-architecture.md` for context.
2. Clone new repo, copy piano-roll files.
3. Introduce API interfaces and context/provider.
4. Replace store imports with injected APIs.
5. Stub demo app + README.
6. Verify marquee selection, zoom, copy/paste still work in the demo.
