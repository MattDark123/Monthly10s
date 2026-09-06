import { getNotificationSettings, saveNotificationSettings } from "./storage";
import { monthKey } from "./date";

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
  const periodicSync = (reg as unknown as { periodicSync?: { register: (tag: string, opts: { minInterval: number }) => Promise<void> } })
    .periodicSync;
  if (!periodicSync) return false;
  try {
    await periodicSync.register("monthly10s-check", { minInterval: 20 * 60 * 60 * 1000 });
    return true;
  } catch {
    return false;
  }
}

/** Should the in-app "new month" banner show right now? */
export function shouldShowNewMonthBanner(): boolean {
  const settings = getNotificationSettings();
  const now = new Date();
  const thisMonth = monthKey(now);
  return now.getDate() >= settings.reminderDay && settings.lastNewMonthShown !== thisMonth;
}

export function dismissNewMonthBanner(): void {
  const settings = getNotificationSettings();
  saveNotificationSettings({ ...settings, lastNewMonthShown: monthKey() });
}

export function shouldShowMidMonthBanner(): boolean {
  const settings = getNotificationSettings();
  if (!settings.midMonthNudge) return false;
  const now = new Date();
  const thisMonth = monthKey(now);
  return now.getDate() >= settings.midMonthDay && settings.lastMidMonthShown !== thisMonth;
}

export function dismissMidMonthBanner(): void {
  const settings = getNotificationSettings();
  saveNotificationSettings({ ...settings, lastMidMonthShown: monthKey() });
}

export async function initNotifications(): Promise<void> {
  await registerPeriodicSync();
  await triggerImmediateCheck();
}
