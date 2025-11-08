"use client";

import { useMemo, useRef } from "react";
import type { MidiNoteClip } from "@/core/midi/types";
import { useTrackStore } from "@/core/stores/useTrackStore";

interface VelocityLaneProps {
  width: number;
  height: number;
  clips: MidiNoteClip[];
  scrollLeft: number;
  pixelsPerBeat: number;
  msPerBeat: number;
  selectedClipIds: string[];
  onVelocityChange: (clipIds: string[], velocity: number) => void;
  isOpen?: boolean;
}

const DEFAULT_VELOCITY = 0.8;

export const VelocityLane = ({
  width,
  height,
  clips,
  scrollLeft,
  pixelsPerBeat,
  msPerBeat,
  selectedClipIds,
  onVelocityChange,
  isOpen,
}: VelocityLaneProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tracks = useTrackStore((state) => state.tracks);
  const viewWidth = Math.max(1, width);
  const laneOpen = isOpen !== false;

  const trackColorMap = useMemo(() => {
    const map = new Map<string, string>();
    tracks.forEach((track) => {
      map.set(track.id, track.color);
    });
    return map;
  }, [tracks]);

  const selectedSet = useMemo(() => new Set(selectedClipIds), [selectedClipIds]);

  const bars = useMemo(() => {
    if (!laneOpen)
      return [] as Array<{ clip: MidiNoteClip; x: number; barWidth: number; velocity: number }>;

    return clips.map((clip) => {
      const startBeats = clip.start / msPerBeat;
      const x = startBeats * pixelsPerBeat - scrollLeft;
      const durationBeats = clip.duration / msPerBeat;
      const barWidth = Math.max(6, Math.min(12, durationBeats * pixelsPerBeat * 0.6));
      const velocity = clip.velocity ?? DEFAULT_VELOCITY;
      return { clip, x, barWidth, velocity };
    });
  }, [clips, laneOpen, msPerBeat, pixelsPerBeat, scrollLeft]);

  const handlePointerDown = (clipId: string, event: React.PointerEvent<SVGRectElement>) => {
    event.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;

    svg.setPointerCapture(event.pointerId);

    const targetIds =
      selectedSet.has(clipId) && selectedClipIds.length > 0 ? selectedClipIds : [clipId];

    const updateVelocityFromClientY = (clientY: number) => {
      const rect = svg.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const normalized = 1 - relativeY / height;
      const velocity = Math.max(0, Math.min(1, normalized));
      onVelocityChange(targetIds, velocity);
    };

    updateVelocityFromClientY(event.clientY);

    const handleMove = (moveEvent: PointerEvent) => {
      updateVelocityFromClientY(moveEvent.clientY);
    };

    const handleUp = (upEvent: PointerEvent) => {
      updateVelocityFromClientY(upEvent.clientY);
      svg.releasePointerCapture(event.pointerId);
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleDoubleClick = (clipId: string, event: React.MouseEvent) => {
    event.preventDefault();
    const targetIds =
      selectedSet.has(clipId) && selectedClipIds.length > 0 ? selectedClipIds : [clipId];
    onVelocityChange(targetIds, DEFAULT_VELOCITY);
  };

  const viewportBeats = viewWidth / pixelsPerBeat;
  const firstBeat = Math.floor(scrollLeft / pixelsPerBeat) - 1;
  const beatsInView = Math.ceil(viewportBeats) + 3;
  const horizontalLines = [0.25, 0.5, 0.75];

  return (
    <div className="relative w-full overflow-hidden bg-layer-1/60" style={{ height }}>
      {laneOpen && (
        <div className="absolute inset-0 overflow-hidden">
          <svg
            aria-hidden="true"
            ref={svgRef}
            width={viewWidth}
            height={height}
            className="absolute inset-0"
          >
            <rect width={viewWidth} height={height} fill="rgba(10,10,12,0.82)" />
            {horizontalLines.map((line, index) => {
              const y = height * (1 - line);
              return (
                <line
                  key={`h-${index}`}
                  x1={0}
                  y1={y}
                  x2={viewWidth}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth={1}
                />
              );
            })}
            {Array.from({ length: beatsInView }).map((_, idx) => {
              const beat = firstBeat + idx;
              if (beat < 0) return null;
              const x = beat * pixelsPerBeat - scrollLeft;
              if (x < -1 || x > viewWidth + 1) return null;
              return (
                <line
                  key={`beat-${beat}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={height}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth={1}
                />
              );
            })}
            {bars.map(({ clip, x, barWidth, velocity }) => {
              if (x + barWidth < -12 || x > viewWidth + 12) return null;
              const barHeight = velocity * (height - 12);
              const barY = height - barHeight - 6;
              const color = trackColorMap.get(clip.trackId) || "#3b82f6";
              const isSelected = selectedSet.has(clip.id);
              return (
                <g key={clip.id} transform={`translate(${x},0)`}>
                  <line
                    x1={barWidth / 2}
                    y1={height - 6}
                    x2={barWidth / 2}
                    y2={barY}
                    stroke={color}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeOpacity={0.45}
                  />
                  <rect
                    role="presentation"
                    x={barWidth / 2 - 4}
                    y={barY}
                    width={8}
                    height={Math.max(barHeight, 4)}
                    rx={3}
                    fill={color}
                    fillOpacity={isSelected ? 0.9 : 0.6}
                    stroke={isSelected ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.35)"}
                    strokeWidth={isSelected ? 1.2 : 1}
                    onPointerDown={(event) => handlePointerDown(clip.id, event)}
                    onDoubleClick={(event) => handleDoubleClick(clip.id, event)}
                    style={{ cursor: "ns-resize" }}
                  />
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
