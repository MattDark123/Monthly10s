"use client";

import { useState } from "react";
import { saveName } from "@/lib/sync";

/** First thing sharing needs: something for friends to call you. */
export default function NamePrompt({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    await saveName(trimmed);
    setBusy(false);
    onDone(trimmed);
  }

  return (
    <div className="animate-fade-up rounded-2xl border border-line bg-card p-4">
      <p className="text-[15px] font-semibold">What should friends call you?</p>
      <p className="mt-0.5 text-sm text-muted">Just a first name is fine. It&apos;s the only thing they see about you.</p>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        maxLength={40}
        enterKeyHint="done"
        placeholder="Your name"
        aria-label="Your name"
        className="mt-3 w-full border-b border-line bg-transparent py-2 text-[17px] outline-none focus:border-fg/40"
      />
      <button
        type="button"
        onClick={submit}
        disabled={!name.trim() || busy}
        className="mt-3 rounded-full bg-fg px-4 py-1.5 text-sm font-semibold text-bg transition-transform active:scale-95 disabled:opacity-40"
      >
        {busy ? "Saving…" : "Continue"}
      </button>
    </div>
  );
}
