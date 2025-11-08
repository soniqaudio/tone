"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { deriveFromEvents } from "@/core/midi/derive";
import { NoteStack } from "@/core/midi/noteStack";
import {
  MidiControlChangeEvent,
  MidiDomainEvent,
  MidiNoteEvent,
  MidiRecorderState,
} from "@/core/midi/types";
import { parseMidiMessage } from "@/core/midi/utils";
import { generateId } from "@/core/utils/id";

interface UseMidiRecorderOptions {
  enabled?: boolean;
  channel?: number;
  onNoteOn?: (payload: {
    noteId: string;
    noteNumber: number;
    velocity: number;
    timestampMs: number;
    channel: number;
  }) => void;
  onNoteOff?: (payload: {
    noteId: string;
    noteNumber: number;
    timestampMs: number;
    channel: number;
  }) => void;
}

interface MidiRecorderHook {
  state: MidiRecorderState;
  start: (startOffsetMs?: number) => void;
  stop: () => void;
  clear: () => void;
  push: (event: { type: "on" | "off"; note: number; velocity: number; time: number }) => void;
}

const createNoteEvents = (
  type: "on" | "off",
  channel: number,
  noteNumber: number,
  velocity: number,
  timestamp: number,
  noteId: string,
): { domainEvent: MidiDomainEvent; noteEvent: MidiNoteEvent; noteId: string } => {
  const eventType = type === "on" ? "noteOn" : "noteOff";
  const noteEventType = type === "on" ? "noteon" : "noteoff";

  return {
    domainEvent: {
      id: `evt-${type}-${generateId()}`,
      type: eventType,
      timestamp,
      noteNumber,
      velocity,
      channel,
      noteId,
    },
    noteEvent: {
      id: `${noteEventType}-${channel}-${noteNumber}-${generateId()}`,
      timestamp,
      type: noteEventType,
      noteNumber,
      velocity,
      channel,
      noteId,
    },
    noteId,
  };
};

const createDomainEventId = (prefix: string) => `${prefix}-${generateId()}`;

export const useMidiRecorder = (
  midiInput: MIDIInput | null,
  options: UseMidiRecorderOptions = {},
): MidiRecorderHook => {
  const { enabled = true, channel, onNoteOn, onNoteOff } = options;
  const [state, setState] = useState<MidiRecorderState>({
    isRecording: false,
    events: [],
    noteEvents: [],
    controlEvents: [],
    clips: [],
    clipsWithoutSustain: [],
  });
  const recordingRef = useRef(false);
  const channelFilter = channel;
  const startedAtRef = useRef<number | undefined>(undefined);
  const activeNotesRef = useRef<NoteStack>(new NoteStack());

  const handleMidiMessage = useCallback(
    (event: MIDIMessageEvent) => {
      if (!recordingRef.current) return;

      const parsed = parseMidiMessage(event);
      const now = performance.now();
      startedAtRef.current ??= now;
      const relativeTimestamp = now - startedAtRef.current;

      if (
        (parsed.messageType === "noteon" || parsed.messageType === "noteoff") &&
        parsed.noteNumber !== undefined
      ) {
        if (typeof channelFilter === "number" && parsed.channel !== channelFilter) {
          return;
        }

        const noteNumber = parsed.noteNumber;
        const velocity = parsed.velocity ?? 0;

        if (parsed.messageType === "noteon") {
          const noteId = `note-${noteNumber}-${generateId()}`;
          const { domainEvent, noteEvent } = createNoteEvents(
            "on",
            parsed.channel,
            noteNumber,
            velocity,
            relativeTimestamp,
            noteId,
          );

          activeNotesRef.current.push(noteNumber, noteId, parsed.channel);

          setState((prev) => ({
            ...prev,
            events: [...prev.events, domainEvent],
            noteEvents: [...prev.noteEvents, noteEvent],
          }));

          // Call callback AFTER setState
          onNoteOn?.({
            noteId,
            noteNumber,
            velocity,
            timestampMs: relativeTimestamp,
            channel: parsed.channel ?? 0,
          });
        } else {
          // Handle note off
          const active = activeNotesRef.current.pop(noteNumber);
          if (!active) return;

          const { domainEvent, noteEvent } = createNoteEvents(
            "off",
            parsed.channel,
            noteNumber,
            velocity,
            relativeTimestamp,
            active.noteId,
          );

          setState((prev) => ({
            ...prev,
            events: [...prev.events, domainEvent],
            noteEvents: [...prev.noteEvents, noteEvent],
          }));

          // Call callback AFTER setState
          onNoteOff?.({
            noteId: active.noteId,
            noteNumber,
            timestampMs: relativeTimestamp,
            channel: active.channel,
          });
        }
        return;
      }

      if (parsed.messageType === "control" && parsed.controlNumber !== undefined) {
        setState((prev) => {
          const domainEvent: MidiDomainEvent = {
            id: createDomainEventId("evt-cc"),
            type: "cc",
            timestamp: relativeTimestamp,
            controller: parsed.controlNumber,
            value: parsed.value ?? 0,
            channel: parsed.channel,
          };
          const ccEvent: MidiControlChangeEvent = {
            id: domainEvent.id,
            timestamp: domainEvent.timestamp,
            controller: domainEvent.controller,
            value: domainEvent.value,
            channel: domainEvent.channel,
          };

          return {
            ...prev,
            events: [...prev.events, domainEvent],
            controlEvents: [...prev.controlEvents, ccEvent],
          };
        });
      }
    },
    [channelFilter, onNoteOn, onNoteOff],
  );

  useEffect(() => {
    if (!midiInput || !enabled) {
      return;
    }

    midiInput.addEventListener("midimessage", handleMidiMessage);
    return () => {
      midiInput.removeEventListener("midimessage", handleMidiMessage);
    };
  }, [midiInput, enabled, handleMidiMessage]);

  const start = useCallback((startOffsetMs = 0) => {
    recordingRef.current = true;
    const startedAt = performance.now() - startOffsetMs;
    startedAtRef.current = startedAt;
    activeNotesRef.current.clear();
    setState({
      isRecording: true,
      startedAt,
      events: [],
      noteEvents: [],
      controlEvents: [],
      clips: [],
      clipsWithoutSustain: [],
    });
  }, []);

  const stop = useCallback(() => {
    recordingRef.current = false;
    const now = performance.now();
    const startTime = startedAtRef.current ?? now;
    const stopTimestamp = now - startTime;
    const lingeringNotes = activeNotesRef.current.drain();

    setState((prev) => {
      let events = prev.events;
      let noteEvents = prev.noteEvents;

      if (lingeringNotes.length > 0) {
        const extraDomainEvents: MidiDomainEvent[] = [];
        const extraNoteEvents: MidiNoteEvent[] = [];

        lingeringNotes.forEach(({ noteNumber, noteId, channel }) => {
          const { domainEvent, noteEvent } = createNoteEvents(
            "off",
            channel,
            noteNumber,
            0,
            stopTimestamp,
            noteId,
          );
          extraDomainEvents.push(domainEvent);
          extraNoteEvents.push(noteEvent);
        });

        events = [...prev.events, ...extraDomainEvents];
        noteEvents = [...prev.noteEvents, ...extraNoteEvents];
      }

      const derived = deriveFromEvents(events);
      return {
        ...prev,
        isRecording: false,
        events,
        noteEvents,
        clips: derived.clips,
        clipsWithoutSustain: derived.clipsWithoutSustain,
        controlEvents: derived.controlEvents,
      };
    });
    startedAtRef.current = undefined;
  }, []);

  const clear = useCallback(() => {
    activeNotesRef.current.clear();
    startedAtRef.current = undefined;
    setState({
      isRecording: false,
      events: [],
      noteEvents: [],
      controlEvents: [],
      clips: [],
      clipsWithoutSustain: [],
    });
    recordingRef.current = false;
  }, []);

  const push = useCallback(
    (event: { type: "on" | "off"; note: number; velocity: number; time: number }) => {
      const now = event.time;
      startedAtRef.current ??= now;
      const relativeTimestamp = recordingRef.current ? now - startedAtRef.current : 0;

      const noteNumber = event.note;
      const velocity = event.velocity;

      if (event.type === "on") {
        const noteId = `note-${noteNumber}-${generateId()}`;
        const { domainEvent, noteEvent } = createNoteEvents(
          "on",
          0,
          noteNumber,
          velocity,
          relativeTimestamp,
          noteId,
        );

        activeNotesRef.current.push(noteNumber, noteId, 0);

        setState((prev) => ({
          ...prev,
          events: [...prev.events, domainEvent],
          noteEvents: [...prev.noteEvents, noteEvent],
        }));

        // Call callback AFTER setState
        onNoteOn?.({
          noteId,
          noteNumber,
          velocity,
          timestampMs: relativeTimestamp,
          channel: 0,
        });
      } else {
        // Handle note off
        const active = activeNotesRef.current.pop(noteNumber);
        if (!active) return;

        const { domainEvent, noteEvent } = createNoteEvents(
          "off",
          0,
          noteNumber,
          velocity,
          relativeTimestamp,
          active.noteId,
        );

        setState((prev) => ({
          ...prev,
          events: [...prev.events, domainEvent],
          noteEvents: [...prev.noteEvents, noteEvent],
        }));

        // Call callback AFTER setState
        onNoteOff?.({
          noteId: active.noteId,
          noteNumber,
          timestampMs: relativeTimestamp,
          channel: 0,
        });
      }
    },
    [onNoteOn, onNoteOff],
  );

  return {
    state,
    start,
    stop,
    clear,
    push,
  };
};
