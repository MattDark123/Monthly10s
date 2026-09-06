"use client";

import { useEffect, useState } from "react";
import {
  getCurrentMonth,
  getProfile,
  saveProfile,
  addItem,
  toggleItem,
  updateItemText,
  deleteItem,
} from "@/lib/storage";
import {
  shouldShowNewMonthBanner,
  dismissNewMonthBanner,
  shouldShowMidMonthBanner,
  dismissMidMonthBanner,
  requestNotificationPermission,
  notificationPermission,
} from "@/lib/notifications";
import { MonthList, Profile, MAX_ITEMS } from "@/lib/types";
import { monthLabel } from "@/lib/date";
import { monthKey } from "@/lib/date";
import { Idea } from "@/lib/ideas";
import ListItemRow from "@/components/ListItemRow";
import AddItemRow from "@/components/AddItemRow";
import ProgressBadge from "@/components/ProgressBadge";
import IdeaShuffleButton from "@/components/IdeaShuffleButton";
import ReminderBanner from "@/components/ReminderBanner";
import OnboardingFlow from "@/components/OnboardingFlow";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState<MonthList | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNewMonthBanner, setShowNewMonthBanner] = useState(false);
  const [showMidMonthBanner, setShowMidMonthBanner] = useState(false);

  useEffect(() => {
    setList(getCurrentMonth());
    const p = getProfile();
    setProfile(p);
    setShowOnboarding(!p.onboardingComplete);
    setShowNewMonthBanner(shouldShowNewMonthBanner());
    setShowMidMonthBanner(shouldShowMidMonthBanner());
    setMounted(true);
  }, []);

  if (!mounted || !list || !profile) {
    return <div className="flex-1" />;
  }

  const key = monthKey();
  const doneCount = list.items.filter((i) => i.done).length;
  const full = list.items.length >= MAX_ITEMS;

  function refresh(updated: MonthList) {
    setList(updated);
  }

  async function handleAcceptReminder() {
    dismissNewMonthBanner();
    setShowNewMonthBanner(false);
    if (notificationPermission() === "default") {
      await requestNotificationPermission();
    }
  }

  function handleAddIdea(idea: Idea) {
    refresh(addItem(key, idea.text, idea.id));
  }

  const usedIdeaIds = list.items.map((i) => i.ideaId).filter((x): x is string => !!x);

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

      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink/50">{monthLabel(key)}</p>
          <h1 className="text-2xl font-bold">Your ten</h1>
        </div>
        <ProgressBadge done={doneCount} total={list.items.length} />
      </header>

      {showNewMonthBanner && (
        <ReminderBanner
          title="Fresh month, fresh ten ✨"
          body="No pressure — just jot down a few things you'd like to do."
          onDismiss={handleAcceptReminder}
        />
      )}
      {!showNewMonthBanner && showMidMonthBanner && (
        <ReminderBanner
          title="Halfway through the month 👋"
          body="Just a friendly nudge — no grading here."
          onDismiss={() => {
            dismissMidMonthBanner();
            setShowMidMonthBanner(false);
          }}
        />
      )}

      <div className="mb-4">
        <IdeaShuffleButton
          profile={profile}
          usedIdeaIds={usedIdeaIds}
          disabled={full}
          onPick={handleAddIdea}
        />
      </div>

      <ul className="flex flex-col gap-2">
        {list.items.map((item) => (
          <ListItemRow
            key={item.id}
            item={item}
            onToggle={() => refresh(toggleItem(key, item.id))}
            onEdit={(text) => refresh(updateItemText(key, item.id, text))}
            onDelete={() => refresh(deleteItem(key, item.id))}
          />
        ))}
      </ul>

      <div className="mt-2">
        <AddItemRow disabled={full} onAdd={(text) => refresh(addItem(key, text))} />
      </div>

      {list.items.length === 0 && (
        <p className="mt-6 text-center text-sm text-ink/40">
          Ten low-stakes things. No consequences for skipping any of them.
        </p>
      )}
    </div>
  );
}
