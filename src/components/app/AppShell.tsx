"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { ResizableDivider } from "@/components/app/ResizableDivider";
import { Sidebar } from "@/components/app/Sidebar";
import { MixerView } from "@/components/Mixer/MixerView";
import { PlaylistView } from "@/components/Playlist/PlaylistView";
import { useMetronome } from "@/core/hooks/useMetronome";
import { useStopRecordingOnTransport } from "@/core/hooks/useStopRecordingOnTransport";
import { playbackController } from "@/core/playback/playbackController";
import { useMidiStore } from "@/core/stores/useMidiStore";
import { useTransportStore } from "@/core/stores/useTransportStore";
import { useUIStore } from "@/core/stores/useUIStore";
import { useViewStore } from "@/core/stores/useViewStore";
import KeyboardInput from "@/features/pianoroll/components/KeyboardInput";
import PianoRoll from "@/features/pianoroll/components/PianoRoll";
import TopBar from "@/features/pianoroll/components/TopBar";

export function AppShell() {
  const clips = useMidiStore((state) => state.clips);
  const playheadMs = useTransportStore((state) => state.playheadMs);
  const isPlaying = useTransportStore((state) => state.isPlaying);
  const isRecording = useMidiStore((state) => state.isRecording);
  const hasRecordingPreviews = useMidiStore((state) => state.recordingPreviewClips.length > 0);
  const updateRecordingPreviews = useMidiStore((state) => state.actions.updateRecordingPreviews);

  const activeView = useViewStore((state) => state.activeView);
  const setActiveView = useViewStore((state) => state.actions.setActiveView);

  useStopRecordingOnTransport();
  useMetronome();

  // Continuous RAF loop to update preview clip durations while recording
  const rafIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isRecording || !hasRecordingPreviews) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const animate = () => {
      const currentPlayheadMs = useTransportStore.getState().playheadMs;
      updateRecordingPreviews(currentPlayheadMs);
      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isRecording, hasRecordingPreviews, updateRecordingPreviews]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      playbackController.pause();
      return;
    }

    void playbackController.play(clips, playheadMs).catch((error) => {
      console.error("Failed to start playback", error);
    });
  }, [clips, isPlaying, playheadMs]);

  const handleStop = useCallback(() => {
    playbackController.stop();
  }, []);

  const isPianoRollActive = activeView === "piano-roll";

  const viewComponent = useMemo(() => {
    if (activeView === "playlist") {
      return <PlaylistView />;
    }
    if (activeView === "mixer") {
      return <MixerView />;
    }
    return <PianoRoll />;
  }, [activeView]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Spacebar: Play/Pause (unless typing in input)
      if (e.code === "Space" && !isInputElement(e.target)) {
        e.preventDefault();
        handlePlay();
        return;
      }

      // Cmd/Ctrl+1/2/3: View switching
      if (cmdOrCtrl && !e.shiftKey && !e.altKey) {
        if (e.key === "1") {
          e.preventDefault();
          setActiveView("playlist");
          return;
        }
        if (e.key === "2") {
          e.preventDefault();
          setActiveView("piano-roll");
          return;
        }
        if (e.key === "3") {
          e.preventDefault();
          setActiveView("mixer");
          return;
        }
      }
    };

    const isInputElement = (target: EventTarget | null): boolean => {
      if (!target) return false;
      const element = target as HTMLElement;
      return (
        element.tagName === "INPUT" ||
        element.tagName === "TEXTAREA" ||
        element.isContentEditable
      );
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePlay, setActiveView]);

  const sidebarWidth = useUIStore((state) => state.sidebarWidth);
  const isFullSizeView = useUIStore((state) => state.isFullSizeView);
  const toggleFullSizeView = useUIStore((state) => state.actions.toggleFullSizeView);

  // Global keyboard shortcut for full size view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl+F: Toggle full size view
      if (cmdOrCtrl && e.key === "f" && !e.shiftKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return; // Don't toggle if typing in input
        }
        e.preventDefault();
        toggleFullSizeView();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullSizeView]);

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-950 font-sans text-zinc-50">
      {isPianoRollActive ? <KeyboardInput /> : null}
      {!isFullSizeView && <TopBar isPlaying={isPlaying} onPlay={handlePlay} onStop={handleStop} />}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {!isFullSizeView && (
          <>
            <Sidebar style={{ width: sidebarWidth }} />
            <ResizableDivider />
          </>
        )}
        <main className="relative flex flex-1 min-h-0 overflow-hidden bg-zinc-950/90">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 via-transparent to-transparent mix-blend-overlay" />
          <div className="relative z-10 flex-1 min-h-0 overflow-hidden">{viewComponent}</div>
        </main>
      </div>
    </div>
  );
}
