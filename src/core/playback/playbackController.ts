import { audioEngine, type ScheduledPlaybackEvent } from "@/core/audio/audioEngine";
import type { MidiNoteClip } from "@/core/midi/types";
import {
  findFirstPlayableIndex,
  type OrderedClip,
  prepareClipsForPlayback,
} from "@/core/playback/prepareClips";
import { useMidiStore } from "@/core/stores/useMidiStore";
import { useTransportStore } from "@/core/stores/useTransportStore";

interface StopOptions {
  reachedEnd?: boolean;
  hardStop?: boolean;
}

class PlaybackController {
  private orderedClips: OrderedClip[] = [];
  private clipIndex = 0;
  private totalDurationMs = 0;
  private playbackStartMs = 0;
  private playbackStartContextTimeSec = 0;
  private scheduledThroughMs = 0;
  private schedulerTimeout: number | null = null;
  private rafId: number | null = null;
  private readonly schedulerIntervalMs = 26;
  private readonly schedulerHorizonMs = 180;
  private readonly catchUpMs = 20;
  private active = false;

  async play(clips: MidiNoteClip[], startMs: number) {
    const targetStartMs = Math.max(0, startMs);

    await audioEngine.resume();
    const ctx = audioEngine.getContext();

    this.stopLoops();
    this.resetInternalState();

    const { clips: ordered, totalDurationMs } = prepareClipsForPlayback(clips);
    this.orderedClips = ordered;
    this.totalDurationMs = totalDurationMs;
    this.playbackStartMs = Math.min(targetStartMs, totalDurationMs || targetStartMs);
    this.playbackStartContextTimeSec = ctx.currentTime;
    this.clipIndex = findFirstPlayableIndex(ordered, this.playbackStartMs);
    this.scheduledThroughMs = this.playbackStartMs;
    this.active = true;

    const actions = useTransportStore.getState().actions;
    actions.beginPlayback({
      startMs: this.playbackStartMs,
      contextTimeSec: this.playbackStartContextTimeSec,
    });

    this.flushSchedulerWindow(ctx.currentTime, true);
    this.startSchedulerLoop();
    this.startRafLoop();
  }

  pause() {
    const ctx = audioEngine.getContext();
    this.stopLoops();
    audioEngine.stopAll();
    this.active = false;

    const actions = useTransportStore.getState().actions;
    actions.pause({ contextTimeSec: ctx.currentTime });
    this.resetInternalState();
  }

  stop() {
    this.stopLoops();
    audioEngine.stopAll();
    this.active = false;

    useTransportStore.getState().actions.stop();
    this.resetInternalState();
  }

  private startSchedulerLoop() {
    const tick = () => {
      if (!this.active) return;
      const ctx = audioEngine.getContext();
      this.flushSchedulerWindow(ctx.currentTime);
      this.schedulerTimeout = window.setTimeout(tick, this.schedulerIntervalMs);
    };

    this.schedulerTimeout = window.setTimeout(tick, this.schedulerIntervalMs);
  }

  private startRafLoop() {
    const step = () => {
      if (!this.active) return;

      const ctx = audioEngine.getContext();
      const contextTime = ctx.currentTime;

      useTransportStore.getState().actions.updateFromAudioTime(contextTime);

      const endAction = this.getEndAction(contextTime);
      if (endAction === "loop") {
        this.loopToStart();
        return;
      }
      if (endAction === "stop") {
        this.stopInternal({ reachedEnd: true });
        return;
      }

      this.rafId = requestAnimationFrame(step);
    };

    this.rafId = requestAnimationFrame(step);
  }

  private flushSchedulerWindow(currentContextTime: number, force = false) {
    if (!this.active) return;

    const currentTimelineMs = this.computeTimelinePosition(currentContextTime);
    let windowStartMs = this.scheduledThroughMs;

    if (force) {
      windowStartMs = this.playbackStartMs;
    } else {
      if (currentTimelineMs + this.schedulerHorizonMs <= this.scheduledThroughMs + this.catchUpMs) {
        return;
      }
      if (currentTimelineMs > this.scheduledThroughMs) {
        windowStartMs = currentTimelineMs;
      }
    }

    windowStartMs = Math.max(windowStartMs, this.playbackStartMs);

    if (this.totalDurationMs > 0 && windowStartMs >= this.totalDurationMs) {
      return;
    }

    const windowEndMs =
      this.totalDurationMs > 0
        ? Math.min(windowStartMs + this.schedulerHorizonMs, this.totalDurationMs)
        : windowStartMs + this.schedulerHorizonMs;

    const events: ScheduledPlaybackEvent[] = [];
    let index = this.clipIndex;

    while (index < this.orderedClips.length) {
      const clip = this.orderedClips[index];
      const clipStart = clip.startMs;
      const clipEnd = clip.startMs + clip.durationMs;

      if (clipEnd <= windowStartMs) {
        index += 1;
        continue;
      }

      if (clipStart > windowEndMs) {
        break;
      }

      const effectiveStart = Math.max(clipStart, windowStartMs);
      const remainingDuration = clipEnd - effectiveStart;
      if (remainingDuration <= 0) {
        index += 1;
        continue;
      }

      const startTimeSec =
        this.playbackStartContextTimeSec + (effectiveStart - this.playbackStartMs) / 1000;
      events.push({
        noteNumber: clip.noteNumber,
        velocity: clip.velocity,
        startTimeSec,
        durationSec: Math.max(0.001, remainingDuration / 1000),
      });

      index += 1;
    }

    this.clipIndex = index;
    this.scheduledThroughMs = windowEndMs;
    audioEngine.scheduleEvents(currentContextTime, events);
  }

  private computeTimelinePosition(contextTimeSec: number) {
    const elapsedSec = Math.max(0, contextTimeSec - this.playbackStartContextTimeSec);
    return this.playbackStartMs + elapsedSec * 1000;
  }

  private getEndAction(contextTimeSec: number): "loop" | "stop" | null {
    const { recordArm } = useMidiStore.getState();
    if (recordArm) {
      return null;
    }

    if (this.totalDurationMs <= 0 || this.orderedClips.length === 0) {
      return null;
    }

    const timelineMs = this.computeTimelinePosition(contextTimeSec);
    if (timelineMs < this.totalDurationMs - 2) {
      return null;
    }

    return "loop";
  }

  private loopToStart() {
    if (!this.active) return;

    const ctx = audioEngine.getContext();
    const startMs = 0;

    this.stopLoops();
    audioEngine.stopAll();

    this.clipIndex = findFirstPlayableIndex(this.orderedClips, startMs);
    this.scheduledThroughMs = startMs;
    this.playbackStartMs = startMs;
    this.playbackStartContextTimeSec = ctx.currentTime;

    const actions = useTransportStore.getState().actions;
    actions.beginPlayback({
      startMs,
      contextTimeSec: this.playbackStartContextTimeSec,
    });

    this.flushSchedulerWindow(this.playbackStartContextTimeSec, true);
    this.startSchedulerLoop();
    this.startRafLoop();
  }

  private stopInternal(options: StopOptions) {
    this.stopLoops();
    audioEngine.stopAll();
    this.active = false;

    const actions = useTransportStore.getState().actions;
    if (options.reachedEnd) {
      actions.hardSetState({
        isPlaying: false,
        playheadMs: this.totalDurationMs,
        startMs: this.totalDurationMs,
        startContextTimeSec: null,
      });
    } else if (options.hardStop) {
      actions.stop();
    } else {
      actions.pause({ contextTimeSec: audioEngine.getContext().currentTime });
    }

    this.resetInternalState();
  }

  private stopLoops() {
    if (this.schedulerTimeout !== null) {
      window.clearTimeout(this.schedulerTimeout);
      this.schedulerTimeout = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private resetInternalState() {
    this.orderedClips = [];
    this.clipIndex = 0;
    this.totalDurationMs = 0;
    this.playbackStartMs = 0;
    this.playbackStartContextTimeSec = 0;
    this.scheduledThroughMs = 0;
  }
}

export const playbackController = new PlaybackController();
