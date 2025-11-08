# Tone DAW - Development Roadmap

## Critical Architectural Decisions to Keep in Mind

### 1. Pattern System Architecture
**Decision: FL Studio-style (Pattern-based)**
- Reusable patterns that can be referenced multiple times in playlist
- Ghost notes infrastructure already supports this
- Better for MIDI sequence reuse

### 2. Audio Routing
**Decision: Start with global instrument, plan for per-track later**
- Phase 1-3: Keep global soundfont piano (simpler)
- Future: Implement per-track instrument loading (`loadOneshotForTrack`)

### 3. Undo/Redo Scope
**Decision: Keep per-store temporal state for now**
- Currently only MIDI store has Zundo
- Will revisit global history system after Phase 3

---

## Phase 1: Quick Wins - UI Polish & Keyboard Shortcuts

### Keyboard Controls
- [x] **Spacebar play/pause** - ✅ Implemented in AppShell.tsx (prevents trigger when typing in inputs)
- [x] **Cmd+1/2/3 view switching** - ✅ Implemented in AppShell.tsx (1=Playlist, 2=Piano Roll, 3=Mixer)
- [x] **Undo/redo** - ✅ Already implemented (Cmd+Z / Cmd+Shift+Z)

### Piano Roll Interactions
- [x] **Piano key click-to-play** - ✅ Implemented in PianoKeys.tsx with 300ms auto-release
- [x] **Piano key highlight on click** - ✅ Integrated with liveEvents system, highlights when clicked
- [x] **Piano key highlight during playback** - ✅ Highlights via activeNotes Set from liveEvents

### UI Improvements
- [x] **Change settings icon** - ✅ Changed to gear emoji (⚙️) in TopBar.tsx
- [x] **Update metronome icon** - ✅ Replaced with proper metronome SVG in TopBar.tsx
- [x] **Center transport controls in topbar** - ✅ Completely redesigned TopBar layout (3-column: left/center/right)
- [x] **Improve tone/file/edit design** - ✅ Added gradient logo, improved spacing, better visual hierarchy
- [x] **Move undo/redo to right side** - ✅ Made smaller (h-7 w-7), moved to right section with settings

---

## Phase 2: Core Editing Features

### Piano Roll Tools
- [ ] **Cut tool** - Split notes in half at cursor position
- [ ] **Piano roll zoom** - Horizontal zoom in/out (scale pixelsPerBeat)
  - Add zoom state to UIStore: `pianoRollZoomLevel: number` (0.5 - 4.0x)
  - Add zoom controls or mousewheel handler
  - Multiply pixelsPerBeat by zoom level

### Velocity Editing
- [ ] **Per-note velocity selection UI** - Velocity lane already exists, ensure selection works properly
- [ ] **Velocity drag editing for multiple notes** - Already implemented, verify functionality

### Layout & UX
- [ ] **Resizable panels** - Browser/AI and main window draggable resize
- [ ] **Full-screen mode** - Hide topbar and left sidebar
- [ ] **Smooth panel resize transitions** - Add drag handles and smooth animations

---

## Phase 3: Pattern & Multi-Track System

### Pattern System (FL Studio style)
- [ ] **Create Pattern Store** - New store for reusable MIDI clip containers
  ```typescript
  interface Pattern {
    id: string;
    name: string;
    trackId: string;
    midiClips: MidiNoteClip[];
    color: string;
  }
  ```
- [ ] **Pattern creation UI** - Add "New Pattern" button
- [ ] **Pattern switching** - Dropdown or tabs to switch between patterns in piano roll
- [ ] **Ghost notes per pattern** - Show other patterns as reference

### Playlist View
- [ ] **Playlist clip system** - Clips reference patterns and placement in timeline
  ```typescript
  interface PlaylistClip {
    id: string;
    patternId: string;
    startMs: number;
    duration: number;
    trackIndex: number;
  }
  ```
- [ ] **Playlist UI functional** - Replace mock data with real store integration
- [ ] **Drag & drop clips** - Place patterns in timeline
- [ ] **Clip resizing** - Adjust duration/loop count
- [ ] **Track management** - Add/remove/reorder tracks in playlist

### Mixer View
- [ ] **Mixer UI functional** - Connect to track store instead of mock data
- [ ] **Real volume faders** - Connect to track volume state
- [ ] **Mute/solo functionality** - Wire up to playback engine
- [ ] **Pan controls** - Implement stereo panning
- [ ] **Level meters** - Real-time audio level display

### Track Syncing
- [ ] **Link playlist tracks to mixer channels** - Same track ID across views
- [ ] **Track name syncing** - Rename in one view updates all views
- [ ] **Track color consistency** - Color shows across piano roll, playlist, mixer
- [ ] **Pattern-track relationship** - Each pattern belongs to one track

### Global Audio Timeline
- [ ] **Sync playhead across all views** - Transport state drives all views
- [ ] **Timeline ruler consistency** - Same time markings in playlist and piano roll
- [ ] **Loop region support** - Set loop points in playlist
- [ ] **Playback from playlist** - Play arranged clips instead of just piano roll

---

## Phase 4: Customization & Quality of Life

### Visual Customization
- [ ] **Customizable playhead color** - Theme setting
- [ ] **Customizable note highlight color** - User preference
- [ ] **Grid line opacity/color** - Adjust visibility
- [ ] **Time marker customization** - Style options for beat/bar markers

### Theme System
- [ ] **Theme store** - Create useThemeStore.ts
- [ ] **Dynamic CSS variable injection** - Apply custom colors
- [ ] **Theme presets** - Default, high contrast, etc.
- [ ] **Export/import themes** - Save user preferences

### Keyboard Shortcuts
- [ ] **Shortcut customization UI** - Settings panel for rebinding keys
- [ ] **Shortcut conflict detection** - Warn when binding conflicts
- [ ] **Shortcut hints/overlay** - Show available shortcuts on hover

### State Persistence
- [ ] **Save UI state** - Panel sizes, scroll positions
- [ ] **Restore workspace layout** - Remember last session
- [ ] **Project auto-save** - Periodic backups
- [ ] **Recent projects list** - Quick access to previous work

---

## Technical Debt & Performance

### Piano Roll Refactoring
- [ ] **Fix double `usePianoRollDerivedState()` call** - Currently called twice per render (PianoRoll.tsx:62 and :122)
- [ ] **Split PianoRoll component** - Container/Presenter pattern to reduce complexity
- [ ] **Memoize canvas layers** - Add React.memo to NotesLayer, GhostNotesLayer, etc.

### Memory Management
- [ ] **Fix active notes map cleanup** - Clear entries in audioEngine.noteOff() (audioEngine.ts:39)
- [ ] **Add ResizeObserver cleanup** - Prevent accumulation of observers
- [ ] **Implement event array limits** - Circular buffer for very long recording sessions

### Code Quality
- [ ] **Extract hardcoded colors** - Move magic values to CSS variables (NotesLayer.tsx)
- [ ] **Document scheduler design** - Add comments explaining audio timing architecture
- [ ] **Document interaction flow** - Explain note manipulation state machines

---

## Feature Completions

### Sustain Pedal
- ✅ Sustain toggle is view-only (shows full/short notes)
- Audio behavior remains the same regardless of view setting
- Current implementation is correct for intended use case

### Time Signature Support
- [ ] **Dynamic time signature** - Remove hardcoded 4/4 (Timeline.tsx:73)
- [ ] **Time signature changes** - Support changes mid-song
- [ ] **UI for time signature** - Settings or track metadata

### Per-Track Audio
- [ ] **Complete `loadOneshotForTrack` implementation** - Currently stubbed
- [ ] **Sample browser integration** - Load different instruments per track
- [ ] **Track instrument routing** - Route MIDI to correct Tone.js instrument

---

## Data Flow Architecture (for reference)

```
Piano Roll (edit Pattern)
  ↓ saves to
Pattern Store
  ↓ referenced by
Playlist Clips (arrangement)
  ↓ plays through
Transport/Playback Controller
  ↓ outputs to
Mixer (per-track volume/effects)
  ↓
Audio Engine
```

---

## Current Implementation Status

### Already Implemented ✅
- Undo/redo with Cmd+Z / Cmd+Shift+Z
- View switching system (piano-roll | playlist | mixer)
- Velocity editor (VelocityLane.tsx - fully functional)
- Ghost notes system with UI toggle
- Track system with colors
- Piano key highlighting for active notes (activeNotes prop exists)

### Partially Implemented ⚠️
- Piano keys are clickable but no onClick handler
- Playlist/Mixer views are mock-only (hardcoded data)
- Track syncing exists but not connected to playlist

### Not Implemented ❌
- Spacebar play/pause
- Cmd+1/2/3 view switching
- Cut tool for notes
- Piano roll zoom
- Piano key click-to-play audio
- Multiple patterns/clips
- Resizable panels
- Full-screen mode

---

## Notes

**Velocity Editor**: Already fully functional with drag-to-adjust. Selection of multiple notes already works (VelocityLane.tsx:68-69).

**Ghost Notes**: Infrastructure complete (GhostNotesLayer.tsx with dashed border rendering at 20% opacity).

**Active Notes Highlighting**: Piano keys receive `activeNotes` prop and apply highlight styles (PianoKeys.tsx:14), works during playback.

**Track Colors**: Cached in Map for performance, prevents redundant lookups (NotesLayer, GhostNotesLayer).

**Audio Scheduling**: Production-grade look-ahead scheduler (26ms ticks, 180ms horizon, 20ms catch-up threshold).
