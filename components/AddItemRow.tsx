"use client";

import { useState } from "react";

export default function AddItemRow({
  onAdd,
  disabled,
}: {
  onAdd: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onAdd(trimmed);
    setText("");
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-black/10 px-3 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center text-xl text-ink/20">+</span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={disabled ? "Your list is full — nice!" : "Add something small…"}
        disabled={disabled}
        className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink/30 disabled:cursor-not-allowed"
      />
      {text.trim() && (
        <button
          onClick={submit}
          className="shrink-0 rounded-full bg-tangerine px-3 py-1 text-sm font-semibold text-white active:scale-95"
        >
          Add
        </button>
      )}
    </div>
  );
}
