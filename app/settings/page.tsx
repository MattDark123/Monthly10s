"use client";

import { useEffect, useState } from "react";
import {
  getProfile,
  saveProfile,
  resetProfile,
  getNotificationSettings,
  saveNotificationSettings,
  clearAllData,
} from "@/lib/storage";
import { Profile, NotificationSettings } from "@/lib/types";
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from "@/lib/notifications";
import OnboardingFlow from "@/components/OnboardingFlow";

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notif, setNotif] = useState<NotificationSettings | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setProfile(getProfile());
    setNotif(getNotificationSettings());
    setPermission(notificationPermission());
    setMounted(true);
  }, []);

  if (!mounted || !profile || !notif) return <div className="flex-1" />;

  function updateNotif(patch: Partial<NotificationSettings>) {
    const updated = { ...notif!, ...patch };
    saveNotificationSettings(updated);
    setNotif(updated);
  }

  async function toggleReminders(enabled: boolean) {
    if (enabled && notificationsSupported()) {
      const perm = await requestNotificationPermission();
      setPermission(perm);
    }
    updateNotif({ remindersEnabled: enabled });
  }

  return (
    <div className="flex flex-1 flex-col px-5 pt-8">
      {showOnboarding && (
        <OnboardingFlow
          onComplete={(p) => {
            saveProfile(p);
            setProfile(p);
            setShowOnboarding(false);
          }}
          onSkip={() => {
            const skipped: Profile = { onboardingComplete: true };
            saveProfile(skipped);
            setProfile(skipped);
            setShowOnboarding(false);
          }}
        />
      )}

      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/40">Reminders</h2>
        <div className="flex flex-col gap-3 rounded-2xl bg-white/70 p-4">
          <ToggleRow
            label="New-month reminder"
            checked={notif.remindersEnabled}
            onChange={toggleReminders}
          />
          {notif.remindersEnabled && (
            <div className="flex items-center justify-between text-sm text-ink/70">
              <span>Remind me on day</span>
              <input
                type="number"
                min={1}
                max={28}
                value={notif.reminderDay}
                onChange={(e) => updateNotif({ reminderDay: Number(e.target.value) || 1 })}
                className="w-16 rounded-lg border border-black/10 px-2 py-1 text-right"
              />
            </div>
          )}
          <div className="h-px bg-black/5" />
          <ToggleRow
            label="One mid-month nudge"
            checked={notif.midMonthNudge}
            onChange={(v) => updateNotif({ midMonthNudge: v })}
          />
          {notif.midMonthNudge && (
            <div className="flex items-center justify-between text-sm text-ink/70">
              <span>Around day</span>
              <input
                type="number"
                min={1}
                max={28}
                value={notif.midMonthDay}
                onChange={(e) => updateNotif({ midMonthDay: Number(e.target.value) || 15 })}
                className="w-16 rounded-lg border border-black/10 px-2 py-1 text-right"
              />
            </div>
          )}
          {permission === "denied" && (
            <p className="text-xs text-ink/50">
              Notifications are blocked in your browser settings — the in-app banner will still show
              when you open the app.
            </p>
          )}
          {permission === "unsupported" && (
            <p className="text-xs text-ink/50">
              Your browser doesn&apos;t support notifications here. On iPhone, add this app to your home
              screen first (iOS 16.4+ required).
            </p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/40">
          Your profile (local only)
        </h2>
        <p className="mb-3 text-sm text-ink/60">
          Used only to filter idea suggestions. Never leaves your device.
        </p>
        <div className="rounded-2xl bg-white/70 p-4 text-sm text-ink/70">
          <ProfileSummaryRow label="Locality" value={profile.locality ?? "not set"} />
          <ProfileSummaryRow label="Climate" value={profile.hemisphere ?? "not set"} />
          <ProfileSummaryRow label="Kids at home" value={boolLabel(profile.hasKids)} />
          <ProfileSummaryRow label="Has a pet" value={boolLabel(profile.hasPet)} />
          <ProfileSummaryRow label="Prefer free activities" value={boolLabel(profile.preferFree)} />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowOnboarding(true)}
            className="flex-1 rounded-full bg-tangerine py-2.5 text-sm font-semibold text-white active:scale-95"
          >
            Edit profile
          </button>
          <button
            onClick={() => {
              resetProfile();
              setProfile(getProfile());
            }}
            className="flex-1 rounded-full bg-black/5 py-2.5 text-sm font-semibold text-ink/60 active:scale-95"
          >
            Clear profile
          </button>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-ink/40">Data</h2>
        <p className="mb-3 text-sm text-ink/60">
          Everything is stored only on this device — your lists, archive, and profile.
        </p>
        {!confirmClear ? (
          <button
            onClick={() => setConfirmClear(true)}
            className="w-full rounded-full bg-coral/10 py-2.5 text-sm font-semibold text-coral active:scale-95"
          >
            Erase all data on this device
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                clearAllData();
                setProfile(getProfile());
                setNotif(getNotificationSettings());
                setConfirmClear(false);
              }}
              className="flex-1 rounded-full bg-coral py-2.5 text-sm font-semibold text-white active:scale-95"
            >
              Yes, erase everything
            </button>
            <button
              onClick={() => setConfirmClear(false)}
              className="flex-1 rounded-full bg-black/5 py-2.5 text-sm font-semibold text-ink/60 active:scale-95"
            >
              Cancel
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function boolLabel(v: boolean | undefined) {
  return v === true ? "yes" : v === false ? "no" : "not set";
}

function ProfileSummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span>{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between text-left"
    >
      <span className="text-base font-medium">{label}</span>
      <span
        className={`relative h-7 w-12 rounded-full transition-colors ${
          checked ? "bg-tangerine" : "bg-black/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
