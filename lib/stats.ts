import { Category, MonthList } from "./types";
import { categoryOf, CATEGORIES } from "./categories";

export interface CategoryStat {
  category: Category;
  listed: number;
  done: number;
  /** done / listed, 0..1 */
  rate: number;
}

export interface Insights {
  months: number;
  listed: number;
  done: number;
  /** average items done per month, one decimal */
  avgDone: number;
  bestMonth?: { monthKey: string; done: number; listed: number };
  /** themes with at least one item, most-listed first */
  categories: CategoryStat[];
  /** the theme you put on the list most */
  favourite?: Category;
  /** the theme that most reliably gets done (needs a little data) */
  reliable?: Category;
  /** the theme that most often slips (needs a little data) */
  slips?: Category;
}

const MIN_SAMPLE = 3;

export function computeInsights(months: MonthList[]): Insights {
  const past = months.filter((m) => m.items.length > 0);
  const byCat = new Map<Category, { listed: number; done: number }>();
  for (const c of CATEGORIES) byCat.set(c.id, { listed: 0, done: 0 });

  let listed = 0;
  let done = 0;
  let bestMonth: Insights["bestMonth"];

  for (const m of past) {
    let monthDone = 0;
    for (const item of m.items) {
      const cat = categoryOf(item);
      const s = byCat.get(cat)!;
      s.listed += 1;
      listed += 1;
      if (item.done) {
        s.done += 1;
        done += 1;
        monthDone += 1;
      }
    }
    if (!bestMonth || monthDone > bestMonth.done) {
      bestMonth = { monthKey: m.monthKey, done: monthDone, listed: m.items.length };
    }
  }

  const categories: CategoryStat[] = CATEGORIES.map((c) => {
    const s = byCat.get(c.id)!;
    return { category: c.id, listed: s.listed, done: s.done, rate: s.listed ? s.done / s.listed : 0 };
  })
    .filter((s) => s.listed > 0)
    .sort((a, b) => b.listed - a.listed || b.done - a.done);

  const favourite = categories[0]?.category;

  const enough = categories.filter((s) => s.listed >= MIN_SAMPLE && s.category !== "other");
  const byRateDesc = [...enough].sort((a, b) => b.rate - a.rate || b.listed - a.listed);
  const reliable = byRateDesc[0] && byRateDesc[0].rate >= 0.6 ? byRateDesc[0].category : undefined;
  const byRateAsc = [...enough].sort((a, b) => a.rate - b.rate || b.listed - a.listed);
  const slipsCandidate = byRateAsc[0];
  const slips =
    slipsCandidate && slipsCandidate.rate <= 0.4 && slipsCandidate.category !== reliable
      ? slipsCandidate.category
      : undefined;

  return {
    months: past.length,
    listed,
    done,
    avgDone: past.length ? Math.round((done / past.length) * 10) / 10 : 0,
    bestMonth,
    categories,
    favourite,
    reliable,
    slips,
  };
}
