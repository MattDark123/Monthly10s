"use client";

import { useState } from "react";
import { Idea } from "@/lib/ideas";
import { pickIdea } from "@/lib/shuffle";
import { Profile } from "@/lib/types";

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

  function shuffle() {
    const idea = pickIdea(profile, usedIdeaIds);
    setSuggestion(idea ?? null);
  }

  return (
    <div className="rounded-2xl bg-tangerine/10 p-3">
      {suggestion ? (
        <div className="animate-fade-in space-y-2">
          <p className="text-sm text-ink/60">Stuck? Here&apos;s an idea:</p>
          <p className="text-base font-medium">{suggestion.text}</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                onPick(suggestion);
                setSuggestion(null);
              }}
              disabled={disabled}
              className="rounded-full bg-tangerine px-4 py-2 text-sm font-semibold text-white active:scale-95 disabled:opacity-40"
            >
              Add to my list
            </button>
            <button
              onClick={shuffle}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink/70 active:scale-95"
            >
              Give me another
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={shuffle}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 py-1 text-sm font-semibold text-tangerine disabled:opacity-40"
        >
          🎲 Stuck? Tap for an idea
        </button>
      )}
    </div>
  );
}
