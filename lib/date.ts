export function monthKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function monthDate(key: string): Date {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function monthLabel(key: string): string {
  return monthDate(key).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export function monthName(key: string): string {
  return monthDate(key).toLocaleDateString(undefined, { month: "long" });
}

export function previousMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m - 2, 1));
}

export function nextMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(y, m, 1));
}

export function compareMonthKeysDesc(a: string, b: string): number {
  return a < b ? 1 : a > b ? -1 : 0;
}
