"use client";

import { useState } from "react";
import { Category, ListItem } from "@/lib/types";
import { CATEGORIES, categoryOf } from "@/lib/categories";
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
  index,
  mode,
  onToggle,
  onEdit,
  onDelete,
  onCategory,
}: {
  item: ListItem;
  index: number;
  /** "current" shows a checkbox; "plan" shows a number — nothing to tick yet */
  mode: "current" | "plan";
  onToggle: () => void;
  onEdit: (text: string) => void;
  onDelete: () => void;
  onCategory: (category: Category | undefined) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const effective = categoryOf(item);

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== item.text) onEdit(trimmed);
    else setDraft(item.text);
    setEditing(false);
  }

  return (
    <li className="animate-fade-up border-b border-line">
      <div className="flex min-h-[56px] items-center gap-4 py-2">
        {mode === "current" ? (
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
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center text-sm tabular-nums text-muted">
            {index + 1}
          </span>
        )}

        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => {
              // Keep editing open when focus moves to a chip or Remove.
              const next = e.relatedTarget as HTMLElement | null;
              if (next?.dataset.keepEditing) return;
              commit();
            }}
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
            data-keep-editing
            onClick={onDelete}
            className="shrink-0 text-sm font-medium text-muted transition-colors active:text-accent"
          >
            Remove
          </button>
        )}
      </div>

      {editing && (
        <div className="animate-fade-in -mx-6 flex gap-2 overflow-x-auto px-6 pb-3 pl-[4.25rem] [scrollbar-width:none]">
          {CATEGORIES.map((c) => {
            const selected = c.id === effective;
            return (
              <button
                key={c.id}
                type="button"
                data-keep-editing
                onClick={() => {
                  // Tapping the highlighted chip clears an override back to auto.
                  if (selected && item.category) onCategory(undefined);
                  else onCategory(c.id);
                }}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selected ? "bg-fg text-bg" : "bg-fg/5 text-muted"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </li>
  );
}
