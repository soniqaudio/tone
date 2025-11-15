# Piano Roll Architecture

## Overview
The piano roll is implemented as a layered canvas UI driven by derived state and a collection of interaction hooks. Rendering is split into lightweight components (static grid, notes, ghost notes, dynamic overlay) that share timing data, while user interactions (selection, movement, zoom) are centralized in dedicated hooks. Zustand stores provide the single source of truth for MIDI data, UI settings, and transport state, ensuring consistent behavior across editing, playback, and clipboard actions.

## Module Map

| File/Module | Responsibility |
|-------------|----------------|
| `src/features/pianoroll/components/PianoRoll.tsx` | Top-level feature component. Composes store data, derived state, canvas layers, keyboard shortcuts, scroll sync, and interaction hooks. Owns wheel zoom handling and layout of piano keys, grid, and velocity lane. |
| `hooks/usePianoRollDerivedState.ts` | Computes all render-time values: piano keys list, note-to-index map, filtered clips, zoomed timing constants, grid width, playhead position. Ensures pixelsPerBeat/keyHeight reflect current zoom sliders. |
| `hooks/usePianoRollInteractions.ts` | Central interaction hub. Wires note creation/deletion, movement, resizing, marquee selection, viewport dragging, scrubber control, and cursor management. Converts pointer coordinates to world space using live scroll offsets so all downstream hooks operate in consistent units. |
| `hooks/useCanvasSize.ts` | Tracks scroll offsets and viewport size of the canvas container. Feeds scrollLeft/scrollTop to interactions, scroll-sync, and derived state. |
| `hooks/usePianoRollScrollSync.ts` | Restores stored scroll position, syncs scroll back to the UI store, expands grid width on demand, and handles auto-follow of the playhead. |
| `hooks/usePianoRollKeyboardShortcuts.ts` | Global key handling (copy/paste, cut, quantize, transpose, etc.). Reads pointer location from the UI store to place pasted clips at the cursor. Skips shortcuts only when focus is on actual text inputs. |
| `interactions/useMarqueeSelection.ts` | Manages marquee rectangle. Stores both pixel coordinates (for drawing) and normalized selection bounds (ms + key indices) so zoom/scroll changes don’t affect hit testing. Exposes `selectionRect` for the overlay and selection lifecycle callbacks. |
| `interactions/useNoteMovement.ts`, `useNoteResize.ts`, `useNoteCreation.ts`, `useNoteDeletion.ts`, `useTimelineScrub.ts`, `useViewportNavigation.ts` | Focused hooks handling their respective gestures. Each receives timing/geometry helpers so they can work entirely in world space. |
| `interactions/useCursorManagement.ts` | Updates the UI cursor and pointer data based on hover state. Stores pointer ms/note so clipboard paste knows where to insert notes. |
| `layers/StaticGrid.tsx` | Renders the background grid (rows + beat lines). Applies `ctx.translate(-scrollLeft, 0)` to stay aligned with scroll and uses zoomed `pixelsPerBeat`/`keyHeight` for spacing. |
| `layers/NotesLayer.tsx` | Draws active track clips. Computes visible notes via viewport bounds and renders rectangles with track colors. Shares the same translation as the grid to stay synchronized. |
| `layers/GhostNotesLayer.tsx` | Same as NotesLayer but for ghost/reference clips from other tracks. Faded styling. |
| `layers/DynamicOverlay.tsx` | Draws selection outlines, playhead overlays, active notes, and the marquee rectangle. Uses the `selectionRect` provided by `useMarqueeSelection` and applies scroll translation before drawing. |
| `layers/VelocityLane.tsx` | Canvas-based velocity editor that mirrors the grid scroll. Uses the same timing conversions to map note positions to velocity bars. |
| `lib/coords.ts` | Shared helpers for converting between beats/pixels/ms and generating the piano key list. |
| `hooks/usePianoRollKeyboardShortcuts.ts` + `core/stores/useUIStore.ts` | Together define pointer tracking, zoom sliders, grid resolution, and clipboard, ensuring a consistent UI/interaction contract. |

## Data Flow
1. **Stores → Derived State**: MIDI, transport, and UI Zustand stores supply clips, tempo, zoom settings, and scroll preferences. `usePianoRollDerivedState` combines them into render-ready structures (pixel dimensions, playhead, filtered clips).
2. **Derived State → Interactions**: `usePianoRollInteractions` receives all timing/geometry values plus refs to scroll containers. It converts pointer events to world coordinates once, then delegates to specialized hooks (movement, marquee, resize, etc.).
3. **Interactions → Store Updates**: Hooks call MIDI/UI store actions (add/remove notes, set selection, update scroll) in response to gestures. Pointer positions are mirrored into `useUIStore` so keyboard shortcuts (e.g., paste) know where to act.
4. **Rendering Layers**: Canvas layers consume the derived state plus scroll offsets. Each layer prepares its own canvas, applies `ctx.translate(-scrollLeft, 0)`, and renders only visible content for performance.
5. **Overlay Feedback**: `useMarqueeSelection` exposes `selectionRect`, which `DynamicOverlay` draws directly. Because selection bounds are stored in ms/key space, selection results remain accurate despite zoom changes.

## Key Patterns & Gotchas
- **Coordinate Consistency**: Always convert pointer positions to world space using the live scroll offset (`containerRef.current?.scrollLeft`). Store semantic units (ms, key index) whenever possible; only convert to pixels when drawing.
- **Zoom Handling**: Wheel/pinch zoom prevents default immediately, measures cursor relative to the grid (excluding piano keys), and applies scroll + zoom inside a single `requestAnimationFrame` to avoid jitter.
- **Canvas Translation**: Every canvas layer applies `ctx.translate(-scrollLeft, 0)` before drawing, so horizontal scroll stays aligned. Don’t bake scroll into note coordinates; let the canvas transform handle it.
- **Clipboard/Paste**: Paste uses the pointer position stored in `useUIStore`. Ensure cursor management runs even when no notes are under the pointer so pointer ms/note remain fresh.
- **Marquee Selection**: Selection hit testing now operates in ms/key space; when modifying it, keep both the pixel rect (for drawing) and normalized bounds (for hit tests) in sync.
- **Scroll Sync**: `usePianoRollScrollSync` is the single source for maintaining scroll state across sessions and follow mode. Avoid manually mutating scroll positions elsewhere without updating the store.

This document should be kept up to date whenever new hooks or layers are introduced so future work (and future AI helpers) can navigate the architecture quickly.
