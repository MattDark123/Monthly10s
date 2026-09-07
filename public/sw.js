// Monthly 10s service worker
// Responsibilities:
//  1. Cache the app shell so the app works fully offline after first load.
//  2. Best-effort local notification scheduling for the "new month" reminder
//     and the optional mid-month nudge, using IndexedDB (readable from both
//     the page and this worker) instead of localStorage (which a service
//     worker cannot access).
//
// Honest limitation (documented in README too): there is no push server, so
// a notification can only fire when (a) the app is opened and the in-page
// check runs, or (b) the browser supports the Periodic Background Sync API
// (currently Chrome/Android for installed PWAs only) and grants it. iOS has
// no periodic background sync, so on iOS the reminder is guaranteed only via
// the in-app banner shown on next open, plus a notification fired the moment
// the app is opened on/after the reminder day.

const CACHE_NAME = "monthly10s-shell-v2";
const APP_SHELL = ["/", "/archive", "/settings", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Strategy:
//  - Navigations (HTML): network-first, fall back to cache. Keeps the page
//    in step with the JS chunks it references after a deploy, while still
//    loading offline.
//  - Everything else same-origin (hashed /_next/static assets, icons):
//    cache-first, refresh in the background.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

// ---- Minimal IndexedDB helper (mirrors lib/idb.ts on the page side) ----
const DB_NAME = "monthly10s-notify";
const STORE = "kv";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function runReminderCheck() {
  // Never fire unless the user turned reminders on *and* granted permission.
  if (!self.Notification || self.Notification.permission !== "granted") return;

  const settings = await idbGet("settings");
  if (!settings || !settings.remindersEnabled) return;

  const now = new Date();
  const thisMonth = monthKey(now);
  let changed = false;

  if (now.getDate() >= (settings.reminderDay || 1) && settings.lastNewMonthShown !== thisMonth) {
    await self.registration.showNotification("A fresh month", {
      body: "Jot down a few small things you'd like to do. Ten is the cap, not the goal.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "monthly10s-new-month",
      data: { url: "/" },
    });
    settings.lastNewMonthShown = thisMonth;
    changed = true;
  }

  if (
    settings.midMonthNudge &&
    now.getDate() >= (settings.midMonthDay || 15) &&
    settings.lastMidMonthShown !== thisMonth
  ) {
    await self.registration.showNotification("Halfway there", {
      body: "Just a nudge to peek at your list. Nothing's overdue.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "monthly10s-mid-month",
      data: { url: "/" },
    });
    settings.lastMidMonthShown = thisMonth;
    changed = true;
  }

  if (changed) await idbSet("settings", settings);
}

self.addEventListener("periodicsync", (event) => {
  if (event.tag === "monthly10s-check") {
    event.waitUntil(runReminderCheck());
  }
});

// Fallback for browsers without periodic background sync: the page asks us
// to check immediately whenever it starts up.
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "MONTHLY10S_CHECK_NOW") {
    event.waitUntil(runReminderCheck());
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
