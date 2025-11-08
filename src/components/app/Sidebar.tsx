"use client";

import { useMemo } from "react";

const placeholderItems = [
  { title: "Instruments", items: ["Piano", "Keys", "Pads"] },
  { title: "Drums", items: ["808s", "Hats", "Kicks"] },
  { title: "Samples", items: ["Loops", "Textures", "Vocals"] },
];

export function Sidebar() {
  const sections = useMemo(() => placeholderItems, []);

  return (
    <aside className="hidden w-64 shrink-0 bg-zinc-950/95 text-zinc-200 border-r border-zinc-900/80 lg:flex lg:flex-col">
      <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
        Browser
      </div>
      <div className="flex-1 overflow-auto">
        {sections.map((section) => (
          <div key={section.title} className="px-4 py-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              {section.title}
            </div>
            <ul className="space-y-1 text-sm text-zinc-300">
              {section.items.map((item) => (
                <li
                  key={item}
                  className="rounded px-2 py-1 transition-colors hover:bg-zinc-800/60 hover:text-zinc-50"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
