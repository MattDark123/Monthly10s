"use client";

import { useEffect } from "react";
import { onMonthSaved, getIdentity } from "@/lib/storage";
import { pushMonth, pushShareableMonths, sharingConfigured } from "@/lib/sync";

/** Keeps shared months up to date. Does nothing unless sharing is
 * configured for this deployment and turned on by the user. */
export default function SyncBootstrap() {
  useEffect(() => {
    if (!sharingConfigured()) return;

    let timer: number | null = null;
    const unsubscribe = onMonthSaved((list) => {
      if (!getIdentity().sharingEnabled) return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => void pushMonth(list), 600);
    });

    // Catch up anything edited offline.
    if (getIdentity().sharingEnabled) void pushShareableMonths();

    return () => {
      unsubscribe();
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return null;
}
