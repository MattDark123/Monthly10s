import {
  MonthList,
  Profile,
  NotificationSettings,
  ListItem,
  Category,
  Preferences,
  Identity,
  MAX_ITEMS,
} from "./types";
import { monthKey } from "./date";
import { idbSet } from "./idb";

// -----------------------------------------------------------------------
// Data-layer abstraction. Everything the app reads/writes goes through this
// module. v1 implements it on top of localStorage; a future cross-device
// sync version (e.g. Supabase free tier) can swap the implementation below
// without touching any component code, as long as it keeps this same shape.
// -----------------------------------------------------------------------

const KEYS = {
  months: "monthly10s:months", // { [monthKey]: MonthList }
  profile: "monthly10s:profile",
  notifications: "monthly10s:notifications",
  prefs: "monthly10s:prefs",
  identity: "monthly10s:identity",
};

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — fail silently, it's a local convenience store
  }
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---- Months / lists ----

type MonthsMap = Record<string, MonthList>;

export function getAllMonths(): MonthsMap {
  return readJson<MonthsMap>(KEYS.months, {});
}

export function getMonth(key: string): MonthList {
  const months = getAllMonths();
  return (
    months[key] || {
      monthKey: key,
      items: [],
      updatedAt: new Date().toISOString(),
    }
  );
}

export function getCurrentMonth(): MonthList {
  return getMonth(monthKey());
}

type MonthListener = (list: MonthList) => void;
const monthListeners = new Set<MonthListener>();

/** Be told whenever a month is written. Used by the optional sync layer so
 * this module never has to know about any backend. */
export function onMonthSaved(cb: MonthListener): () => void {
  monthListeners.add(cb);
  return () => monthListeners.delete(cb);
}

function saveMonth(list: MonthList): void {
  const months = getAllMonths();
  const saved = { ...list, updatedAt: new Date().toISOString() };
  months[list.monthKey] = saved;
  writeJson(KEYS.months, months);
  monthListeners.forEach((cb) => cb(saved));
}

export function addItem(monthKeyStr: string, text: string, ideaId?: string): MonthList {
  const list = getMonth(monthKeyStr);
  const trimmed = text.trim();
  if (!trimmed || list.items.length >= MAX_ITEMS) return list;
  const item: ListItem = {
    id: uid(),
    text: trimmed,
    done: false,
    createdAt: new Date().toISOString(),
    ideaId,
  };
  const updated: MonthList = { ...list, items: [...list.items, item] };
  saveMonth(updated);
  return updated;
}

export function updateItemText(monthKeyStr: string, itemId: string, text: string): MonthList {
  const list = getMonth(monthKeyStr);
  const updated: MonthList = {
    ...list,
    items: list.items.map((it) => (it.id === itemId ? { ...it, text } : it)),
  };
  saveMonth(updated);
  return updated;
}

export function toggleItem(monthKeyStr: string, itemId: string): MonthList {
  const list = getMonth(monthKeyStr);
  const updated: MonthList = {
    ...list,
    items: list.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)),
  };
  saveMonth(updated);
  return updated;
}

export function deleteItem(monthKeyStr: string, itemId: string): MonthList {
  const list = getMonth(monthKeyStr);
  const updated: MonthList = { ...list, items: list.items.filter((it) => it.id !== itemId) };
  saveMonth(updated);
  return updated;
}

export function reorderItems(monthKeyStr: string, orderedIds: string[]): MonthList {
  const list = getMonth(monthKeyStr);
  const byId = new Map(list.items.map((it) => [it.id, it]));
  const items = orderedIds.map((id) => byId.get(id)).filter((x): x is ListItem => !!x);
  const updated: MonthList = { ...list, items };
  saveMonth(updated);
  return updated;
}

export function setItemCategory(
  monthKeyStr: string,
  itemId: string,
  category: Category | undefined
): MonthList {
  const list = getMonth(monthKeyStr);
  const updated: MonthList = {
    ...list,
    items: list.items.map((it) => {
      if (it.id !== itemId) return it;
      const { category: _old, ...rest } = it;
      return category ? { ...rest, category } : rest;
    }),
  };
  saveMonth(updated);
  return updated;
}

export function markRolloverHandled(monthKeyStr: string): void {
  const list = getMonth(monthKeyStr);
  saveMonth({ ...list, rolloverHandled: true });
}

/**
 * Copy the chosen unfinished items from one month onto another as fresh,
 * unticked items. Skips anything already on the target list (by text) and
 * stops at the ten-item cap. The source month is left exactly as it was,
 * so the archive stays honest, and is marked as handled.
 */
export function carryItems(
  fromKey: string,
  toKey: string,
  itemIds: string[]
): { added: number; skipped: number } {
  const from = getMonth(fromKey);
  const to = getMonth(toKey);
  const norm = (s: string) => s.trim().toLowerCase();
  const existing = new Set(to.items.map((i) => norm(i.text)));
  const items = [...to.items];
  let added = 0;
  let skipped = 0;

  for (const it of from.items) {
    if (it.done || !itemIds.includes(it.id)) continue;
    if (items.length >= MAX_ITEMS || existing.has(norm(it.text))) {
      skipped += 1;
      continue;
    }
    items.push({
      id: uid(),
      text: it.text,
      done: false,
      createdAt: new Date().toISOString(),
      ideaId: it.ideaId,
      category: it.category,
      carriedFrom: fromKey,
    });
    existing.add(norm(it.text));
    added += 1;
  }

  saveMonth({ ...to, items });
  saveMonth({ ...from, rolloverHandled: true });
  return { added, skipped };
}

/** Past months only (strictly before the current one), newest first.
 * A month planned ahead of time is not archive material. */
export function getArchive(): MonthList[] {
  const months = getAllMonths();
  const current = monthKey();
  return Object.values(months)
    .filter((m) => m.monthKey < current && m.items.length > 0)
    .sort((a, b) => (a.monthKey < b.monthKey ? 1 : -1));
}

// ---- Profile ----

const emptyProfile: Profile = { onboardingComplete: false };

export function getProfile(): Profile {
  return readJson<Profile>(KEYS.profile, emptyProfile);
}

export function saveProfile(profile: Profile): void {
  writeJson(KEYS.profile, profile);
}

export function resetProfile(): void {
  writeJson(KEYS.profile, emptyProfile);
}

// ---- Notification settings ----

const defaultNotificationSettings: NotificationSettings = {
  remindersEnabled: false,
  reminderDay: 1,
  midMonthNudge: false,
  midMonthDay: 15,
};

export function getNotificationSettings(): NotificationSettings {
  return readJson<NotificationSettings>(KEYS.notifications, defaultNotificationSettings);
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  writeJson(KEYS.notifications, settings);
  // Mirror into IndexedDB so the service worker (no localStorage access) can
  // read it during a periodic background sync check.
  void idbSet("settings", settings);
}

// ---- Preferences (layout etc.) ----

const defaultPreferences: Preferences = { layout: "list", rollover: "auto" };

export function getPreferences(): Preferences {
  return { ...defaultPreferences, ...readJson<Partial<Preferences>>(KEYS.prefs, {}) };
}

export function savePreferences(prefs: Preferences): void {
  writeJson(KEYS.prefs, prefs);
}

// ---- Identity (for sharing) ----

const defaultIdentity: Identity = { name: "", sharingEnabled: false };

export function getIdentity(): Identity {
  return { ...defaultIdentity, ...readJson<Partial<Identity>>(KEYS.identity, {}) };
}

export function saveIdentity(identity: Identity): void {
  writeJson(KEYS.identity, identity);
}

export function clearAllData(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(KEYS.months);
  window.localStorage.removeItem(KEYS.profile);
  window.localStorage.removeItem(KEYS.notifications);
  window.localStorage.removeItem(KEYS.prefs);
  window.localStorage.removeItem(KEYS.identity);
}
