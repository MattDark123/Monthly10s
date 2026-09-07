import { ListItem } from "./types";
import { monthKey, previousMonthKey } from "./date";
import { getMonth, getPreferences, carryItems, markRolloverHandled } from "./storage";

export type RolloverResult =
  | { kind: "carried"; from: string; added: number; skipped: number }
  | { kind: "ask"; from: string; items: ListItem[] }
  | null;

/**
 * Run once when the app opens. Looks only at the immediately previous
 * month, so an update never drags in things from long ago. Returns what
 * happened so the page can say so, or what to ask.
 */
export function settleRollover(): RolloverResult {
  const current = monthKey();
  const from = previousMonthKey(current);
  const prev = getMonth(from);
  if (prev.rolloverHandled || prev.items.length === 0) return null;

  const unfinished = prev.items.filter((i) => !i.done);
  if (unfinished.length === 0) {
    markRolloverHandled(from);
    return null;
  }

  const mode = getPreferences().rollover;
  if (mode === "never") {
    markRolloverHandled(from);
    return null;
  }
  if (mode === "ask") {
    return { kind: "ask", from, items: unfinished };
  }

  const { added, skipped } = carryItems(
    from,
    current,
    unfinished.map((i) => i.id)
  );
  return { kind: "carried", from, added, skipped };
}
