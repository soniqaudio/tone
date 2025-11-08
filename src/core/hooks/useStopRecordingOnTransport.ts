"use client";

import { useEffect, useRef } from "react";
import { playbackController } from "@/core/playback/playbackController";
import { useMidiStore } from "@/core/stores/useMidiStore";
import { useTransportStore } from "@/core/stores/useTransportStore";

export function useStopRecordingOnTransport() {
  const isPlaying = useTransportStore((state) => state.isPlaying);
  const playheadMs = useTransportStore((state) => state.playheadMs);
  const recordArm = useMidiStore((state) => state.recordArm);
  const isRecording = useMidiStore((state) => state.isRecording);
  const midiActions = useMidiStore((state) => state.actions);

  const prevPlayingRef = useRef(isPlaying);
  const prevPlayheadRef = useRef(playheadMs);

  useEffect(() => {
    const prevPlaying = prevPlayingRef.current;
    const prevPlayhead = prevPlayheadRef.current;

    const transportStopped = !isPlaying && prevPlaying;
    const transportRewound = !isPlaying && Math.abs(playheadMs - prevPlayhead) > 1;

    if ((transportStopped || transportRewound) && recordArm) {
      midiActions.setRecordArm(false);
      if (isRecording) {
        midiActions.setRecording(false);
        playbackController.pause();
      }
      midiActions.clearRecordingPreviews();
    }

    prevPlayingRef.current = isPlaying;
    prevPlayheadRef.current = playheadMs;
  }, [isPlaying, playheadMs, recordArm, isRecording, midiActions]);
}
