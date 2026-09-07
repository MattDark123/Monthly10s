"use client";

import { useEffect, useState } from "react";
import { getArchive } from "@/lib/storage";
import { MonthList } from "@/lib/types";
import { monthLabel } from "@/lib/date";
import { ChevronIcon, CheckIcon } from "@/components/Icons";

function positiveLine(done: number, total: number): string {
  if (done === 0) return "A quiet one. Those count too.";
  if (done === total) return `All ${total}. What a month.`;
  return `${done} of ${total}. Nice month.`;
}

export default function ArchivePage() {
  const [months, setMonths] = useState<MonthList[] | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    const m = getArchive();
    setMonths(m);
    setOpenKey(m[0]?.monthKey ?? null);
  }, []);

  if (!months) return null;

  return (
    <>
      <header className="pb-6 pt-10">
        <h1 className="text-[34px] font-semibold leading-none tracking-tight">Archive</h1>
        <p className="mt-4 text-[15px] text-muted">
          {months.length === 0 ? "Past months will collect here." : "Every month, kept as it was."}
        </p>
      </header>

      <ul className="border-t border-line">
        {months.map((m) => {
          const done = m.items.filter((i) => i.done).length;
          const open = openKey === m.monthKey;
          return (
            <li key={m.monthKey} className="border-b border-line">
              <button
                type="button"
                aria-expanded={open}
                className="flex w-full items-center justify-between py-4 text-left transition-opacity active:opacity-60"
                onClick={() => setOpenKey(open ? null : m.monthKey)}
              >
                <span>
                  <span className="block text-[17px] font-medium">{monthLabel(m.monthKey)}</span>
                  <span className="block text-sm text-muted">{positiveLine(done, m.items.length)}</span>
                </span>
                <ChevronIcon
                  size={18}
                  className={`text-muted transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                />
              </button>

              {open && (
                <ul className="animate-fade-in pb-4">
                  {m.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 py-1.5">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                          item.done ? "border-accent bg-accent text-white" : "border-fg/20"
                        }`}
                      >
                        {item.done && <CheckIcon size={11} />}
                      </span>
                      <span className={`text-[15px] ${item.done ? "text-fg" : "text-muted"}`}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
