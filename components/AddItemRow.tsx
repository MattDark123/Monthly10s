"use client";

import { useState } from "react";
import { PlusIcon } from "./Icons";

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

  if (disabled) return null;

  return (
    <div className="flex min-h-[56px] items-center gap-4 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center text-fg/30">
        <PlusIcon size={18} />
      </span>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        onBlur={submit}
        enterKeyHint="done"
        placeholder="Add something small"
        aria-label="Add an item"
        className="min-w-0 flex-1 bg-transparent py-1 text-[17px] leading-snug outline-none"
      />
    </div>
  );
}
