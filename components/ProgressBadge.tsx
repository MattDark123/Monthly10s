export default function ProgressBadge({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 overflow-hidden rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-sage transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="whitespace-nowrap text-sm font-semibold text-ink/70">
        {done}/{total || 10}
      </span>
    </div>
  );
}
