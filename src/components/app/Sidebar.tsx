"use client";

import { useState } from "react";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const chips = ["All", "Drums", "Synth", "Keys", "Guitar", "FX"];

const sounds = [
  { title: "Kick 808", category: "Drums", favorite: true },
  { title: "Snare Tight", category: "Drums", favorite: false },
  { title: "Hi-Hat Closed", category: "Drums", favorite: false },
  { title: "Bass Synth", category: "Synth", favorite: true },
  { title: "Lead Pluck", category: "Synth", favorite: false },
  { title: "Pad Ambient", category: "Synth", favorite: false },
  { title: "Piano C4", category: "Keys", favorite: false },
  { title: "Guitar Strum", category: "Guitar", favorite: true },
];

interface SidebarProps {
  style?: React.CSSProperties;
}

export function Sidebar({ style }: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"browser" | "ai">("browser");
  const [selectedChip, setSelectedChip] = useState("All");

  return (
    <aside
      className="hidden shrink-0 border-r border-border bg-layer-2/95 text-sm lg:flex lg:flex-col shadow-layer-sm backdrop-blur-sm"
      style={style}
    >
      {/* Tabs */}
      <div className="flex items-center gap-0.5 border-b border-border bg-muted/30 p-1 px-2 shadow-layer-sm">
        {[
          { id: "browser", label: "Browser" },
          { id: "ai", label: "AI" },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "browser" | "ai")}
              className={cn(
                "flex-1 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-layer-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
              aria-pressed={isActive}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "browser" ? (
        <>
          <div className="px-4 py-3">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search sounds..."
                className="h-9 w-full pl-3 pr-9 text-xs shadow-layer-sm"
              />
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {chips.map((chip) => {
                const isSelected = selectedChip === chip;
                return (
                  <Button
                    key={chip}
                    variant={isSelected ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSelectedChip(chip)}
                    className={cn(
                      "h-7 rounded-full px-3 text-xs font-medium",
                      isSelected && "shadow-layer-sm"
                    )}
                  >
                    {chip}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto px-4">
            <ul className="space-y-0.5">
              {sounds.map((sound) => (
                <li
                  key={sound.title}
                  className="flex items-center justify-between rounded-sm border border-transparent px-2.5 py-2 text-sm transition-colors hover:border-border/50 hover:bg-muted/20"
                >
                  <div>
                    <p className="font-medium text-foreground">{sound.title}</p>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      {sound.category}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={sound.favorite ? "Remove favorite" : "Add favorite"}
                  >
                    <Star
                      className={cn(
                        "h-3.5 w-3.5",
                        sound.favorite ? "fill-current text-primary" : "text-muted-foreground"
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-border bg-muted/10 px-4 py-2.5 text-xs text-muted-foreground">
            <span>{sounds.length} sounds</span>
            <span>0:00</span>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-col gap-3 px-4 py-4 text-sm">
          <div className="rounded-md border border-border bg-muted/30 p-4 shadow-layer-sm">
            <p className="text-sm font-semibold text-foreground">AI Composer</p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Chat with Tone AI to generate one-shots, chord progressions, or MIDI ideas.
            </p>
            <div className="mt-3 rounded-sm border border-border bg-background px-3 py-2 text-xs text-muted-foreground shadow-layer-sm">
              <p>"Give me a melancholic pad progression at 120 BPM"</p>
            </div>
            <Button variant="default" size="sm" className="mt-3 w-full text-xs">
              Open Chat
            </Button>
          </div>
          <div className="rounded-md border border-dashed border-border p-4 text-center shadow-layer-sm">
            <p className="text-xs text-muted-foreground">
              AI sound design coming soon. Drop prompts here to preview future workflows.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
