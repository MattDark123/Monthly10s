"use client";

import { useState } from "react";
import { ListItem } from "@/lib/types";
import { monthName } from "@/lib/date";
import { CheckIcon } from "./Icons";

/** Shown when the "ask me" rollover setting is on and last month left
 * things unticked. Everything starts selected; nothing is framed as a miss. */
export default function RolloverPrompt({
  from,
  items,
  onCarry,
  onLetGo,
}: {
  from: string;
  items: ListItem[];
  onCarry: (itemIds: string[]) => void;
  onLetGo: () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(items.map((i) => i.id)));

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="animate-fade-up mb-6 rounded-2xl border border-line bg-card p-4">
      <p className="text-[15px] font-semibold">Bring any of these along?</p>
      <p className="mt-0.5 text-sm text-muted">
        Left over from {monthName(from)}. No harm either way.
      </p>

      <ul className="mt-3 divide-y divide-line border-y border-line">
        {items.map((item) => {
          const on = selected.has(item.id);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={on}
                className="flex w-full items-center gap-3 py-2.5 text-left"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
                    on ? "border-fg bg-fg text-bg" : "border-fg/25 text-transparent"
                  }`}
                >
                  <CheckIcon size={13} />
                </span>
                <span className={`text-[15px] ${on ? "text-fg" : "text-muted"}`}>{item.text}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={onLetGo} className="text-sm font-medium text-muted">
          Let them go
        </button>
        <button
          type="button"
          onClick={() => onCarry(Array.from(selected))}
          disabled={selected.size === 0}
          className="rounded-full bg-fg px-4 py-1.5 text-sm font-semibold text-bg transition-transform active:scale-95 disabled:opacity-40"
        >
          Carry {selected.size === items.length ? "all" : selected.size} over
        </button>
      </div>
    </div>
  );
}
