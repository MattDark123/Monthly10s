"use client";

import { useEffect, useState } from "react";
import { getArchive } from "@/lib/storage";
import { MonthList } from "@/lib/types";
import { monthLabel } from "@/lib/date";

function positiveLine(done: number, total: number): string {
  if (total === 0) return "No list that month.";
  if (done === 0) return "A quiet month — that's alright too.";
  if (done === total) return `You did all ${total} — amazing month.`;
  return `You did ${done} of these — nice month.`;
}

export default function ArchivePage() {
  const [months, setMonths] = useState<MonthList[] | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    setMonths(getArchive());
  }, []);

  if (!months) return <div className="flex-1" />;

  return (
    <div className="flex flex-1 flex-col px-5 pt-8">
      <h1 className="mb-6 text-2xl font-bold">Archive</h1>

      {months.length === 0 && (
        <p className="text-sm text-ink/50">
          Past months will show up here once you&apos;ve filled out a list and moved on to the next one.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {months.map((m) => {
          const done = m.items.filter((i) => i.done).length;
          const open = openKey === m.monthKey;
          return (
            <div key={m.monthKey} className="rounded-2xl bg-white/70 p-4">
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setOpenKey(open ? null : m.monthKey)}
              >
                <div>
                  <p className="font-semibold">{monthLabel(m.monthKey)}</p>
                  <p className="text-sm text-ink/60">{positiveLine(done, m.items.length)}</p>
                </div>
                <span className="text-ink/30">{open ? "−" : "+"}</span>
              </button>

              {open && (
                <ul className="mt-3 flex flex-col gap-1.5 border-t border-black/5 pt-3">
                  {m.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 text-sm">
                      <span className={item.done ? "text-sage" : "text-ink/20"}>
                        {item.done ? "✓" : "○"}
                      </span>
                      <span className={item.done ? "text-ink" : "text-ink/50"}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
