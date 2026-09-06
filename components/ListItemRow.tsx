"use client";

import { useState } from "react";
import { ListItem } from "@/lib/types";

export default function ListItemRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: ListItem;
  onToggle: () => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed) onEdit(trimmed);
    else setDraft(item.text);
    setEditing(false);
  }

  return (
    <li className="group flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 shadow-sm animate-fade-in">
      <button
        aria-label={item.done ? "Mark as not done" : "Mark as done"}
        onClick={onToggle}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-base transition-all active:scale-90 ${
          item.done ? "border-sage bg-sage text-white animate-pop" : "border-ink/20 text-transparent"
        }`}
      >
        ✓
      </button>

      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setDraft(item.text);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-2 py-1 text-base outline-none focus:ring-2 focus:ring-tangerine"
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={`min-w-0 flex-1 truncate text-left text-base ${
            item.done ? "text-ink/40 line-through" : "text-ink"
          }`}
        >
          {item.text}
        </button>
      )}

      <button
        aria-label="Delete item"
        onClick={onDelete}
        className="shrink-0 rounded-full px-2 py-1 text-xl text-ink/30 active:text-coral"
      >
        ×
      </button>
    </li>
  );
}
