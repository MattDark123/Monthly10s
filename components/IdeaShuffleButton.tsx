"use client";

import { useState } from "react";
import { Idea } from "@/lib/ideas";
import { pickIdea } from "@/lib/shuffle";
import { Profile } from "@/lib/types";
import { SparkIcon, CloseIcon } from "./Icons";

export default function IdeaShuffleButton({
  profile,
  usedIdeaIds,
  disabled,
  onPick,
}: {
  profile: Profile | undefined;
  usedIdeaIds: string[];
  disabled: boolean;
  onPick: (idea: Idea) => void;
}) {
  const [suggestion, setSuggestion] = useState<Idea | null>(null);
  const [seen, setSeen] = useState<string[]>([]);

  function shuffle() {
    const idea = pickIdea(profile, [...usedIdeaIds, ...seen]);
    if (idea) setSeen((s) => [...s.slice(-20), idea.id]);
    setSuggestion(idea ?? null);
  }

  if (disabled) return null;

  if (!suggestion) {
    return (
      <button
        type="button"
        onClick={shuffle}
        className="flex items-center gap-2 py-3 text-[15px] font-medium text-accent transition-opacity active:opacity-60"
      >
        <SparkIcon size={18} />
        Need an idea?
      </button>
    );
  }

  return (
    <div className="animate-fade-up rounded-2xl bg-accent-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[17px] leading-snug text-fg">{suggestion.text}</p>
        <button
          type="button"
          onClick={() => setSuggestion(null)}
          aria-label="Close suggestion"
          className="-mr-1 -mt-1 shrink-0 p-1 text-muted"
        >
          <CloseIcon size={18} />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            onPick(suggestion);
            setSuggestion(null);
          }}
          className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-transform active:scale-95"
        >
          Add it
        </button>
        <button
          type="button"
          onClick={shuffle}
          className="rounded-full px-4 py-2 text-sm font-semibold text-fg/70 transition-opacity active:opacity-60"
        >
          Another
        </button>
      </div>
    </div>
  );
}
