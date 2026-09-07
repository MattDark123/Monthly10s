"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getCurrentMonth,
  getProfile,
  saveProfile,
  addItem,
  toggleItem,
  updateItemText,
  deleteItem,
  getArchive,
} from "@/lib/storage";
import {
  shouldShowNewMonthBanner,
  dismissNewMonthBanner,
  shouldShowMidMonthBanner,
  dismissMidMonthBanner,
} from "@/lib/notifications";
import { MonthList, Profile, MAX_ITEMS } from "@/lib/types";
import { monthKey } from "@/lib/date";
import { Idea } from "@/lib/ideas";
import ListItemRow from "@/components/ListItemRow";
import AddItemRow from "@/components/AddItemRow";
import ProgressDots from "@/components/ProgressDots";
import IdeaShuffleButton from "@/components/IdeaShuffleButton";
import ReminderBanner from "@/components/ReminderBanner";
import OnboardingFlow from "@/components/OnboardingFlow";

function monthName(key: string) {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: "long" });
}

function doneLine(done: number, total: number): string | null {
  if (total === 0) return null;
  if (done === 0) return "Nothing ticked yet, and that's fine.";
  if (done === total && total === MAX_ITEMS) return "All ten. What a month.";
  if (done === total) return "Everything on the list — lovely.";
  if (done >= 7) return "Look at you go.";
  if (done >= 4) return "A good month already.";
  return "Off to a start.";
}

export default function HomePage() {
  const [list, setList] = useState<MonthList | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasArchive, setHasArchive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [banner, setBanner] = useState<"new" | "mid" | null>(null);

  useEffect(() => {
    setList(getCurrentMonth());
    const p = getProfile();
    setProfile(p);
    setShowOnboarding(!p.onboardingComplete);
    setHasArchive(getArchive().length > 0);
    if (shouldShowNewMonthBanner()) setBanner("new");
    else if (shouldShowMidMonthBanner()) setBanner("mid");
  }, []);

  if (!list || !profile) return null;

  const key = monthKey();
  const done = list.items.filter((i) => i.done).length;
  const full = list.items.length >= MAX_ITEMS;
  const usedIdeaIds = list.items.map((i) => i.ideaId).filter((x): x is string => !!x);
  const subtitle = doneLine(done, list.items.length);

  function finishOnboarding(p: Profile) {
    saveProfile(p);
    setProfile(p);
    setShowOnboarding(false);
  }

  function addIdea(idea: Idea) {
    setList(addItem(key, idea.text, idea.id));
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingFlow
          onComplete={finishOnboarding}
          onSkip={() => finishOnboarding({ onboardingComplete: true })}
        />
      )}

      <header className="pb-6 pt-10">
        <h1 className="text-[34px] font-semibold leading-none tracking-tight">{monthName(key)}</h1>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-[15px] text-muted">{subtitle ?? "Ten small things, no pressure."}</p>
          <ProgressDots done={done} total={list.items.length} />
        </div>
      </header>

      {banner === "new" && (
        <ReminderBanner
          title="A fresh month"
          body="Jot down a few things you'd like to do. Ten is the cap, not the goal."
          onDismiss={() => {
            dismissNewMonthBanner();
            setBanner(null);
          }}
        />
      )}
      {banner === "mid" && (
        <ReminderBanner
          title="Halfway there"
          body="Just a nudge to peek at your list. Nothing's overdue."
          onDismiss={() => {
            dismissMidMonthBanner();
            setBanner(null);
          }}
        />
      )}

      <ul className="border-t border-line">
        {list.items.map((item) => (
          <ListItemRow
            key={item.id}
            item={item}
            onToggle={() => setList(toggleItem(key, item.id))}
            onEdit={(text) => setList(updateItemText(key, item.id, text))}
            onDelete={() => setList(deleteItem(key, item.id))}
          />
        ))}
        <li className={full ? "" : "border-b border-line"}>
          <AddItemRow disabled={full} onAdd={(text) => setList(addItem(key, text))} />
        </li>
      </ul>

      <div className="mt-3">
        <IdeaShuffleButton profile={profile} usedIdeaIds={usedIdeaIds} disabled={full} onPick={addIdea} />
      </div>

      {list.items.length === 0 && (
        <div className="mt-14 text-center">
          <p className="text-[15px] leading-relaxed text-muted">
            Try a recipe. Call someone. Watch a sunrise.
            <br />
            Skipping any of them costs nothing.
          </p>
          {hasArchive && (
            <Link href="/archive" className="mt-4 inline-block text-[15px] font-medium text-accent">
              See last month
            </Link>
          )}
        </div>
      )}
    </>
  );
}
