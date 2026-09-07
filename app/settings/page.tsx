"use client";

import { useEffect, useState } from "react";
import {
  getProfile,
  saveProfile,
  resetProfile,
  getNotificationSettings,
  saveNotificationSettings,
  getPreferences,
  savePreferences,
  clearAllData,
} from "@/lib/storage";
import { Profile, NotificationSettings, Preferences, Layout } from "@/lib/types";
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from "@/lib/notifications";
import OnboardingFlow from "@/components/OnboardingFlow";
import Toggle from "@/components/Toggle";
import { ChevronIcon } from "@/components/Icons";

const DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => i + 1);

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notif, setNotif] = useState<NotificationSettings | null>(null);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [editing, setEditing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setNotif(getNotificationSettings());
    setPrefs(getPreferences());
    setPermission(notificationPermission());
  }, []);

  if (!profile || !notif || !prefs) return null;

  function update(patch: Partial<NotificationSettings>) {
    const next = { ...notif!, ...patch };
    saveNotificationSettings(next);
    setNotif(next);
  }

  async function toggleReminders(enabled: boolean) {
    if (enabled && notificationsSupported()) setPermission(await requestNotificationPermission());
    update({ remindersEnabled: enabled });
  }

  const profileSummary = summarize(profile);

  return (
    <>
      {editing && (
        <OnboardingFlow
          initial={profile}
          onComplete={(p) => {
            saveProfile(p);
            setProfile(p);
            setEditing(false);
          }}
          onSkip={() => setEditing(false)}
        />
      )}

      <header className="pb-6 pt-10">
        <h1 className="text-[34px] font-semibold leading-none tracking-tight">Settings</h1>
      </header>

      <Section title="Layout" caption="How this month's list is shown.">
        <div className="flex items-center justify-between py-4">
          <span className="text-[17px]">Show as</span>
          <div className="flex overflow-hidden rounded-full border border-line">
            {(
              [
                { v: "list", l: "List" },
                { v: "card", l: "Bingo card" },
              ] as { v: Layout; l: string }[]
            ).map(({ v, l }) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  savePreferences({ ...prefs!, layout: v });
                  setPrefs({ ...prefs!, layout: v });
                }}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  prefs.layout === v ? "bg-fg text-bg" : "text-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Reminders">
        <Row label="New-month reminder" hint="One notification when it's time for a fresh list">
          <Toggle checked={notif.remindersEnabled} onChange={toggleReminders} label="New-month reminder" />
        </Row>
        {notif.remindersEnabled && (
          <Row label="On the">
            <DaySelect value={notif.reminderDay} onChange={(d) => update({ reminderDay: d })} />
          </Row>
        )}
        <Row label="Mid-month nudge" hint="One more, optional. Never daily.">
          <Toggle checked={notif.midMonthNudge} onChange={(v) => update({ midMonthNudge: v })} label="Mid-month nudge" />
        </Row>
        {notif.midMonthNudge && (
          <Row label="Around the">
            <DaySelect value={notif.midMonthDay} onChange={(d) => update({ midMonthDay: d })} />
          </Row>
        )}
        {permission === "denied" && (
          <Note>Notifications are blocked in your browser. The in-app reminder still shows when you open the app.</Note>
        )}
        {permission === "unsupported" && (
          <Note>On iPhone, add this app to your Home Screen first — notifications need that, and iOS 16.4 or later.</Note>
        )}
      </Section>

      <Section title="Idea preferences" caption="Only shapes suggestions. Stays on this device.">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex w-full items-center justify-between py-4 text-left transition-opacity active:opacity-60"
        >
          <span>
            <span className="block text-[17px]">{profileSummary ? "Edit answers" : "Answer a few questions"}</span>
            {profileSummary && <span className="block text-sm text-muted">{profileSummary}</span>}
          </span>
          <ChevronIcon size={18} className="text-muted" />
        </button>
        {profileSummary && (
          <button
            type="button"
            onClick={() => {
              resetProfile();
              setProfile({ onboardingComplete: true });
            }}
            className="w-full py-4 text-left text-[17px] text-muted transition-opacity active:opacity-60"
          >
            Clear answers
          </button>
        )}
      </Section>

      <Section title="Data" caption="Lists, archive and preferences live only on this device.">
        {!confirmClear ? (
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            className="w-full py-4 text-left text-[17px] text-accent transition-opacity active:opacity-60"
          >
            Erase everything
          </button>
        ) : (
          <div className="flex items-center justify-between py-4">
            <span className="text-[15px] text-muted">This can&apos;t be undone.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-fg/70"
              >
                Keep
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllData();
                  setProfile(getProfile());
                  setNotif(getNotificationSettings());
                  setPrefs(getPreferences());
                  setConfirmClear(false);
                }}
                className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white"
              >
                Erase
              </button>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}

function summarize(p: Profile): string | null {
  const parts: string[] = [];
  if (p.locality) parts.push(p.locality[0].toUpperCase() + p.locality.slice(1));
  if (p.hemisphere) parts.push(p.hemisphere === "tropical" ? "No seasons" : `${p.hemisphere[0].toUpperCase()}${p.hemisphere.slice(1)} hemisphere`);
  if (p.hasKids) parts.push("kids");
  if (p.hasPet) parts.push("pet");
  if (p.preferFree) parts.push("prefers free");
  return parts.length ? parts.join(" · ") : null;
}

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      {caption && <p className="mt-1 text-sm text-muted">{caption}</p>}
      <div className="mt-3 divide-y divide-line border-y border-line">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="min-w-0">
        <span className="block text-[17px]">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      {children}
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="py-3 text-sm leading-relaxed text-muted">{children}</p>;
}

function DaySelect({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Day of month"
        className="appearance-none rounded-full bg-fg/5 py-2 pl-4 pr-9 text-[15px] font-medium text-fg outline-none"
      >
        {DAY_OPTIONS.map((d) => (
          <option key={d} value={d}>
            {ordinal(d)}
          </option>
        ))}
      </select>
      <ChevronIcon size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted" />
    </div>
  );
}
