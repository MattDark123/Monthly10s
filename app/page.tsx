"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getMonth,
  getProfile,
  saveProfile,
  addItem,
  toggleItem,
  updateItemText,
  deleteItem,
  setItemCategory,
  getArchive,
  getPreferences,
  savePreferences,
} from "@/lib/storage";
import {
  shouldShowNewMonthBanner,
  dismissNewMonthBanner,
  shouldShowMidMonthBanner,
  dismissMidMonthBanner,
} from "@/lib/notifications";
import { MonthList, Profile, Layout, MAX_ITEMS } from "@/lib/types";
import { monthKey, monthName, nextMonthKey, monthDate } from "@/lib/date";
import { Idea } from "@/lib/ideas";
import ListItemRow from "@/components/ListItemRow";
import AddItemRow from "@/components/AddItemRow";
import BingoCard from "@/components/BingoCard";
import ProgressDots from "@/components/ProgressDots";
import IdeaShuffleButton from "@/components/IdeaShuffleButton";
import ReminderBanner from "@/components/ReminderBanner";
import OnboardingFlow from "@/components/OnboardingFlow";
import { GridIcon } from "@/components/Icons";

function doneLine(done: number, total: number): string | null {
  if (total === 0) return null;
  if (done === 0) return "Nothing ticked yet, and that's fine.";
  if (done === total && total === MAX_ITEMS) return "All ten. What a month.";
  if (done === total) return "Everything on the list — lovely.";
  if (done >= 7) return "Look at you go.";
  if (done >= 4) return "A good month already.";
  return "Off to a start.";
}

function planLine(count: number): string {
  if (count === 0) return "Lining things up ahead of time.";
  if (count >= MAX_ITEMS) return "Ten lined up. That's the lot.";
  return `${count} lined up so far.`;
}

type View = "current" | "next";

export default function HomePage() {
  const [view, setView] = useState<View>("current");
  const [layout, setLayout] = useState<Layout>("list");
  const [list, setList] = useState<MonthList | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hasArchive, setHasArchive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [banner, setBanner] = useState<"new" | "mid" | null>(null);

  const currentKey = monthKey();
  const nextKey = nextMonthKey(currentKey);
  const key = view === "current" ? currentKey : nextKey;

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setShowOnboarding(!p.onboardingComplete);
    setLayout(getPreferences().layout);
    setHasArchive(getArchive().length > 0);
    if (shouldShowNewMonthBanner()) setBanner("new");
    else if (shouldShowMidMonthBanner()) setBanner("mid");
  }, []);

  useEffect(() => {
    setList(getMonth(key));
  }, [key]);

  if (!list || !profile) return null;

  const isPlan = view === "next";
  const isCard = layout === "card";
  const mode = isPlan ? "plan" : "current";
  const done = list.items.filter((i) => i.done).length;
  const full = list.items.length >= MAX_ITEMS;
  const usedIdeaIds = list.items.map((i) => i.ideaId).filter((x): x is string => !!x);
  const subtitle = isPlan ? planLine(list.items.length) : doneLine(done, list.items.length);

  function finishOnboarding(p: Profile) {
    saveProfile(p);
    setProfile(p);
    setShowOnboarding(false);
  }

  function flipLayout() {
    const next: Layout = isCard ? "list" : "card";
    savePreferences({ ...getPreferences(), layout: next });
    setLayout(next);
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
        <div className="flex items-baseline justify-between gap-4">
          <h1 key={key} className="animate-fade-in text-[34px] font-semibold leading-none tracking-tight">
            {monthName(key)}
          </h1>
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              onClick={flipLayout}
              aria-label={isCard ? "Show as a list" : "Show as a bingo card"}
              aria-pressed={isCard}
              className={`self-center transition-colors ${isCard ? "text-fg" : "text-muted"}`}
            >
              <GridIcon size={20} strokeWidth={isCard ? 2.25 : 1.75} />
            </button>
            <button
              type="button"
              onClick={() => setView(isPlan ? "current" : "next")}
              className="text-[15px] font-medium text-accent transition-opacity active:opacity-60"
            >
              {isPlan ? `← ${monthName(currentKey)}` : `${monthName(nextKey)} →`}
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-[15px] text-muted">{subtitle ?? "Ten small things, no pressure."}</p>
          {!isPlan && <ProgressDots done={done} total={list.items.length} />}
        </div>
      </header>

      {!isPlan && banner === "new" && (
        <ReminderBanner
          title="A fresh month"
          body={
            list.items.length > 0
              ? `You lined up ${list.items.length} ${list.items.length === 1 ? "thing" : "things"} for ${monthName(
                  currentKey
                )}. Here they are.`
              : "Jot down a few things you'd like to do. Ten is the cap, not the goal."
          }
          onDismiss={() => {
            dismissNewMonthBanner();
            setBanner(null);
          }}
        />
      )}
      {!isPlan && banner === "mid" && (
        <ReminderBanner
          title="Halfway there"
          body="Just a nudge to peek at your list. Nothing's overdue."
          onDismiss={() => {
            dismissMidMonthBanner();
            setBanner(null);
          }}
        />
      )}

      {isCard ? (
        <BingoCard
          key={key}
          items={list.items}
          mode={mode}
          full={full}
          onToggle={(id) => setList(toggleItem(key, id))}
          onAdd={(text) => setList(addItem(key, text))}
          onEdit={(id, text) => setList(updateItemText(key, id, text))}
          onDelete={(id) => setList(deleteItem(key, id))}
          onCategory={(id, c) => setList(setItemCategory(key, id, c))}
        />
      ) : (
        <ul className="border-t border-line">
          {list.items.map((item, i) => (
            <ListItemRow
              key={item.id}
              item={item}
              index={i}
              mode={mode}
              onToggle={() => setList(toggleItem(key, item.id))}
              onEdit={(text) => setList(updateItemText(key, item.id, text))}
              onDelete={() => setList(deleteItem(key, item.id))}
              onCategory={(c) => setList(setItemCategory(key, item.id, c))}
            />
          ))}
          <li className={full ? "" : "border-b border-line"}>
            <AddItemRow disabled={full} onAdd={(text) => setList(addItem(key, text))} />
          </li>
        </ul>
      )}

      <div className="mt-3">
        <IdeaShuffleButton
          profile={profile}
          usedIdeaIds={usedIdeaIds}
          disabled={full}
          forDate={monthDate(key)}
          onPick={addIdea}
        />
      </div>

      {list.items.length === 0 && !isCard && (
        <div className="mt-14 text-center">
          <p className="text-[15px] leading-relaxed text-muted">
            {isPlan ? (
              <>
                Anything you add here becomes
                <br />
                {monthName(nextKey)}&apos;s list when it arrives.
              </>
            ) : (
              <>
                Try a recipe. Call someone. Watch a sunrise.
                <br />
                Skipping any of them costs nothing.
              </>
            )}
          </p>
          {!isPlan && hasArchive && (
            <Link href="/archive" className="mt-4 inline-block text-[15px] font-medium text-accent">
              See last month
            </Link>
          )}
        </div>
      )}
    </>
  );
}
