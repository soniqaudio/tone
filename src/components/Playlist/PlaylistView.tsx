"use client";

export function PlaylistView() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-950/60 text-zinc-500">
      <div className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-600">Playlist</div>
      <p className="text-xs text-zinc-500">
        Arrangement view will live here. For now, the piano roll is the active workspace.
      </p>
    </div>
  );
}
