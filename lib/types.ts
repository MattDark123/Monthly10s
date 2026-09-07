export type LocalityType = "city" | "suburb" | "rural";
export type Hemisphere = "northern" | "southern" | "tropical";

export interface Profile {
  locality?: LocalityType;
  hemisphere?: Hemisphere;
  hasKids?: boolean;
  hasPet?: boolean;
  preferFree?: boolean;
  /** Set once the user has been through onboarding (even if they skipped it). */
  onboardingComplete: boolean;
}

/** Themes an item can belong to. Detected locally from the text (see
 * lib/categories.ts); the user can override per item. */
export type Category =
  | "social"
  | "active"
  | "food"
  | "nature"
  | "rest"
  | "learning"
  | "creative"
  | "explore"
  | "play"
  | "other";

export interface ListItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  /** id of the idea-bank entry this item was added from, if any */
  ideaId?: string;
  /** Explicit theme chosen by the user. Absent = auto-detected at read time. */
  category?: Category;
  /** Month key this item was carried over from, if it rolled forward unfinished. */
  carriedFrom?: string;
}

/** A month's list, keyed by "YYYY-MM". */
export interface MonthList {
  monthKey: string;
  items: ListItem[];
  updatedAt: string;
  /** Set once unfinished items have been carried forward (or let go). */
  rolloverHandled?: boolean;
}

export interface NotificationSettings {
  remindersEnabled: boolean;
  reminderDay: number; // 1-28
  midMonthNudge: boolean;
  midMonthDay: number; // 1-28
  lastNewMonthShown?: string;
  lastMidMonthShown?: string;
}

export type Layout = "list" | "card";

/** What happens to unfinished items when a new month starts. */
export type Rollover = "auto" | "ask" | "never";

export interface Preferences {
  layout: Layout;
  rollover: Rollover;
}

/** Local identity for sharing. Name is the only thing friends ever see. */
export interface Identity {
  name: string;
  /** True once the user has shared with someone; only then do months leave the device. */
  sharingEnabled: boolean;
}

export const MAX_ITEMS = 10;
/** Item tiles on the bingo card (3x3 minus the free centre square). */
export const CARD_SLOTS = 8;
