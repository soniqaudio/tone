"use client";

import { useEffect, useRef } from "react";
import { audioEngine } from "@/core/audio/audioEngine";
import { useMetronomeStore } from "@/core/stores/useMetronomeStore";
import { useMusicTheoryStore } from "@/core/stores/useMusicTheoryStore";
import { useTransportStore } from "@/core/stores/useTransportStore";

const SCHEDULE_AHEAD_MS = 1500;
const SCHEDULER_INTERVAL_MS = 120;
const BEATS_PER_ACCENT = 4;

export const useMetronome = () => {
  const enabled = useMetronomeStore((state) => state.enabled);
  const volume = useMetronomeStore((state) => state.volume);
  const tempo = useMusicTheoryStore((state) => state.tempo);
  const isPlaying = useTransportStore((state) => state.isPlaying);
  const startMs = useTransportStore((state) => state.startMs);
  const startContextTimeSec = useTransportStore((state) => state.startContextTimeSec);

  const schedulerIdRef = useRef<number | null>(null);
  const nextBeatIndexRef = useRef<number>(0);

  // Keep audio engine gain aligned with store volume
  useEffect(() => {
    audioEngine.ensureMetronomeReady();
    audioEngine.setMetronomeVolume(volume);
  }, [volume]);

  // Stop metronome when disabled
  useEffect(() => {
    if (!enabled) {
      audioEngine.stopMetronome();
      if (schedulerIdRef.current != null) {
        clearInterval(schedulerIdRef.current);
        schedulerIdRef.current = null;
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isPlaying || startContextTimeSec == null) {
      audioEngine.stopMetronome();
      if (schedulerIdRef.current != null) {
        clearInterval(schedulerIdRef.current);
        schedulerIdRef.current = null;
      }
      return;
    }

    let disposed = false;
    const msPerBeat = 60000 / Math.max(tempo, 1);
    nextBeatIndexRef.current = Math.ceil(startMs / msPerBeat);

    const scheduleBeats = () => {
      if (disposed) return;

      const metronomeState = useMetronomeStore.getState();
      if (!metronomeState.enabled) {
        return;
      }

      const transportState = useTransportStore.getState();
      if (!transportState.isPlaying || transportState.startContextTimeSec == null) {
        return;
      }

      const currentPlayhead = transportState.playheadMs;
      const windowEndMs = currentPlayhead + SCHEDULE_AHEAD_MS;
      const timelineStartMs = transportState.startMs;
      const timelineStartContext = transportState.startContextTimeSec;

      let beatIndex = nextBeatIndexRef.current;
      let beatMs = beatIndex * msPerBeat;

      if (beatMs < timelineStartMs) {
        beatIndex = Math.ceil(timelineStartMs / msPerBeat);
        beatMs = beatIndex * msPerBeat;
      }

      while (beatMs <= windowEndMs) {
        const offsetMs = beatMs - timelineStartMs;
        if (offsetMs >= -1) {
          const scheduledTimeSec = timelineStartContext + offsetMs / 1000;
          const isAccent = beatIndex % BEATS_PER_ACCENT === 0;
          audioEngine.scheduleMetronomeClick(scheduledTimeSec, isAccent);
        }
        beatIndex += 1;
        beatMs = beatIndex * msPerBeat;
      }

      nextBeatIndexRef.current = beatIndex;
    };

    void audioEngine.resume().catch(() => undefined);
    audioEngine.ensureMetronomeReady();
    audioEngine.setMetronomeVolume(volume);
    scheduleBeats();

    schedulerIdRef.current = window.setInterval(scheduleBeats, SCHEDULER_INTERVAL_MS);

    return () => {
      disposed = true;
      if (schedulerIdRef.current != null) {
        clearInterval(schedulerIdRef.current);
        schedulerIdRef.current = null;
      }
      audioEngine.stopMetronome();
    };
  }, [enabled, isPlaying, startContextTimeSec, startMs, tempo, volume]);
};
