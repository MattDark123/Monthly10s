"use client";

import { useState } from "react";
import { ListItem } from "@/lib/types";
import { CheckIcon } from "./Icons";

function haptic() {
  try {
    navigator.vibrate?.(8);
  } catch {
    /* unsupported */
  }
}

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
    if (trimmed && trimmed !== item.text) onEdit(trimmed);
    else setDraft(item.text);
    setEditing(false);
  }

  return (
    <li className="animate-fade-up border-b border-line">
      <div className="flex min-h-[56px] items-center gap-4 py-2">
        <button
          type="button"
          aria-label={item.done ? "Mark as not done" : "Mark as done"}
          aria-pressed={item.done}
          onClick={() => {
            haptic();
            onToggle();
          }}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-200 active:scale-90 ${
            item.done ? "border-accent bg-accent text-white" : "border-fg/25 bg-transparent text-transparent"
          }`}
        >
          {item.done && <CheckIcon size={15} className="animate-pop" />}
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
            enterKeyHint="done"
            className="min-w-0 flex-1 bg-transparent py-1 text-[17px] leading-snug outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(item.text);
              setEditing(true);
            }}
            className={`min-w-0 flex-1 py-1 text-left text-[17px] leading-snug transition-colors duration-200 ${
              item.done ? "text-muted line-through decoration-fg/20" : "text-fg"
            }`}
          >
            {item.text}
          </button>
        )}

        {editing && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onDelete}
            className="shrink-0 text-sm font-medium text-muted transition-colors active:text-accent"
          >
            Remove
          </button>
        )}
      </div>
    </li>
  );
}
