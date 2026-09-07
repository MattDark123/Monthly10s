import { MAX_ITEMS } from "@/lib/types";

/** Ten small dots: filled = done, outlined = on the list, faint = empty slot. */
export default function ProgressDots({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex items-center gap-3" aria-label={`${done} of ${total} done`}>
      <div className="flex gap-1.5">
        {Array.from({ length: MAX_ITEMS }).map((_, i) => {
          const isDone = i < done;
          const isListed = i < total;
          return (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                isDone ? "bg-accent" : isListed ? "bg-fg/30" : "bg-fg/10"
              }`}
            />
          );
        })}
      </div>
      <span className="text-xs font-medium tabular-nums text-muted">
        {done}
        <span className="text-fg/25">/{total}</span>
      </span>
    </div>
  );
}
