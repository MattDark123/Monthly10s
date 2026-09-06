"use client";

import { useEffect } from "react";
import { initNotifications } from "@/lib/notifications";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => initNotifications())
      .catch(() => {
        // offline-first is best-effort; nothing to do if registration fails
      });
  }, []);

  return null;
}
