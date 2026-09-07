import { Insights as InsightsData } from "@/lib/stats";
import { categoryLabel } from "@/lib/categories";
import { monthName } from "@/lib/date";

/**
 * A read-only look back. One hue for magnitude (bar length = how often a
 * theme makes the list, filled part = how often it got done); every value
 * is labeled in text tokens, so the list doubles as the table view.
 */
export default function Insights({ data }: { data: InsightsData }) {
  if (data.months === 0) return null;

  const maxListed = Math.max(...data.categories.map((c) => c.listed), 1);
  const lines = callouts(data);

  return (
    <section className="mb-10">
      <dl className="grid grid-cols-3 gap-4 border-y border-line py-4">
        <Stat label={data.months === 1 ? "month" : "months"} value={String(data.months)} />
        <Stat label="done" value={`${data.done}`} sub={`of ${data.listed}`} />
        <Stat label="per month" value={data.avgDone.toFixed(1)} />
      </dl>

      {lines.length > 0 && (
        <ul className="mt-5 space-y-1.5">
          {lines.map((l) => (
            <li key={l} className="text-[15px] leading-relaxed text-fg">
              {l}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-7 text-xs font-semibold uppercase tracking-wider text-muted">Themes</h2>
      <ul className="mt-3 space-y-3">
        {data.categories.map((c) => {
          const width = (c.listed / maxListed) * 100;
          const fill = c.listed ? (c.done / c.listed) * 100 : 0;
          return (
            <li key={c.category} className="flex items-center gap-3">
              <span className="w-[4.5rem] shrink-0 text-[15px]">{categoryLabel(c.category)}</span>
              <div className="flex-1">
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-fg/10"
                  style={{ width: `${width}%` }}
                  role="img"
                  aria-label={`${categoryLabel(c.category)}: ${c.done} done of ${c.listed} listed`}
                >
                  <div className="h-full rounded-full bg-accent" style={{ width: `${fill}%` }} />
                </div>
              </div>
              <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">
                {c.done}
                <span className="text-fg/25">/{c.listed}</span>
              </span>
            </li>
          );
        })}
      </ul>
      {data.months < 3 && (
        <p className="mt-4 text-sm text-muted">Patterns firm up after a few months. No rush.</p>
      )}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 text-[22px] font-semibold leading-none tracking-tight tabular-nums">
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-muted">{sub}</span>}
      </dd>
    </div>
  );
}

function callouts(d: InsightsData): string[] {
  const out: string[] = [];
  if (d.favourite && d.favourite !== "other") {
    out.push(`You lean toward ${categoryLabel(d.favourite).toLowerCase()} things.`);
  }
  if (d.reliable) {
    out.push(`${categoryLabel(d.reliable)} plans almost always happen.`);
  }
  if (d.slips) {
    out.push(`${categoryLabel(d.slips)} tends to slip. Fewer of those, or none, is a fine answer.`);
  }
  if (d.bestMonth && d.months > 1 && d.bestMonth.done > 0) {
    out.push(`${monthName(d.bestMonth.monthKey)} was your fullest month, ${d.bestMonth.done} of ${d.bestMonth.listed}.`);
  }
  return out;
}
