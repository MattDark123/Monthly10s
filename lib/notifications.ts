import { getNotificationSettings, saveNotificationSettings } from "./storage";
import { monthKey } from "./date";
import { idbGet, idbSet } from "./idb";
import { NotificationSettings } from "./types";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  return Notification.requestPermission();
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

/** Ask the service worker to run its date check right now (covers browsers
 * without Periodic Background Sync — the check simply runs on every app open). */
export async function triggerImmediateCheck(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => undefined);
  reg?.active?.postMessage({ type: "MONTHLY10S_CHECK_NOW" });
}

/** Best-effort: only works on Chromium-based installed PWAs today. Silently
 * no-ops elsewhere (iOS Safari, desktop browsers) — the in-app banner and
 * open-triggered check are the fallback everywhere. */
export async function registerPeriodicSync(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  const reg = await navigator.serviceWorker.ready.catch(() => undefined);
  if (!reg) return false;
  const periodicSync = (
    reg as unknown as {
      periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> };
    }
  ).periodicSync;
  if (!periodicSync) return false;
  try {
    await periodicSync.register("monthly10s-check", { minInterval: 20 * 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * The service worker may have shown a notification (and recorded that in
 * IndexedDB) while the page was closed. Pull those "last shown" markers back
 * into localStorage so the in-app banner doesn't repeat the same reminder,
 * and so a later settings save doesn't clobber them.
 */
async function syncShownMarkersFromWorker(): Promise<void> {
  const fromWorker = await idbGet<NotificationSettings>("settings");
  if (!fromWorker) return;
  const local = getNotificationSettings();
  const merged: NotificationSettings = {
    ...local,
    lastNewMonthShown: newer(local.lastNewMonthShown, fromWorker.lastNewMonthShown),
    lastMidMonthShown: newer(local.lastMidMonthShown, fromWorker.lastMidMonthShown),
  };
  if (
    merged.lastNewMonthShown !== local.lastNewMonthShown ||
    merged.lastMidMonthShown !== local.lastMidMonthShown
  ) {
    saveNotificationSettings(merged);
  } else {
    // Keep the worker's copy current with any settings changed on the page.
    await idbSet("settings", merged);
  }
}

function newer(a?: string, b?: string): string | undefined {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b; // "YYYY-MM" sorts lexically
}

/** Should the in-app "new month" banner show right now? */
export function shouldShowNewMonthBanner(): boolean {
  const s = getNotificationSettings();
  const now = new Date();
  return now.getDate() >= s.reminderDay && s.lastNewMonthShown !== monthKey(now);
}

export function dismissNewMonthBanner(): void {
  saveNotificationSettings({ ...getNotificationSettings(), lastNewMonthShown: monthKey() });
}

export function shouldShowMidMonthBanner(): boolean {
  const s = getNotificationSettings();
  if (!s.midMonthNudge) return false;
  const now = new Date();
  return now.getDate() >= s.midMonthDay && s.lastMidMonthShown !== monthKey(now);
}

export function dismissMidMonthBanner(): void {
  saveNotificationSettings({ ...getNotificationSettings(), lastMidMonthShown: monthKey() });
}

export async function initNotifications(): Promise<void> {
  await syncShownMarkersFromWorker();
  await registerPeriodicSync();
  await triggerImmediateCheck();
}
