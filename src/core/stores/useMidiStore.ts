import { temporal } from "zundo";
import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { createClipActions } from "./midi/actions/clipActions";
import { createClipboardActions } from "./midi/actions/clipboardActions";
import { createDeviceActions } from "./midi/actions/deviceActions";
import { createFileActions } from "./midi/actions/fileActions";
import { createRecordingActions } from "./midi/actions/recordingActions";
import type { MidiState } from "./midi/types";

export const useMidiStore = create<MidiState>()(
  temporal(
    (set, get) => {
      // Create recording actions first so we can access clearRecordingState
      const recordingActions = createRecordingActions(get, set);

      return {
        // Initial state
        midi: null,
        status: "idle",
        error: undefined,
        devices: [],
        selectedInputId: undefined,
        liveEvents: [],
        clipsWithoutSustain: [],
        controlEvents: [],
        isRecording: false,
        recordArm: false,
        computerInputEnabled: true,
        clips: [],
        events: [],
        selectedClipIds: [],
        midiAccessState: "initial",
        midiAccessError: undefined,
        midiAccessRequestToken: 0,
        recordingPreviewClips: [],
        recordingPreviewMeta: {},

        // Actions - composed from modules
        actions: {
          ...createFileActions(get, set, recordingActions.clearRecordingState),
          ...createDeviceActions(get, set),
          ...createClipActions(get, set),
          ...createClipboardActions(get, set),
          ...recordingActions,
        },
      };
    },
    {
      limit: 20,
      equality: shallow,
      handleSet: (handleSet) => {
        let timeout: NodeJS.Timeout | undefined;
        return (pastState, currentState) => {
          const typedState = (currentState ?? {}) as Partial<MidiState>;
          if (typedState.isRecording) {
            return;
          }

          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            handleSet(pastState, currentState);
          }, 100);
        };
      },
    },
  ),
);
