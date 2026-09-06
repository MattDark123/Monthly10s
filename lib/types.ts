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

export interface ListItem {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  /** id of the idea-bank entry this item was added from, if any */
  ideaId?: string;
}

/** A month's list, keyed by "YYYY-MM". */
export interface MonthList {
  monthKey: string;
  items: ListItem[];
  updatedAt: string;
}

export interface NotificationSettings {
  remindersEnabled: boolean;
  reminderDay: number; // 1-28
  midMonthNudge: boolean;
  midMonthDay: number; // 1-28
  lastNewMonthShown?: string;
  lastMidMonthShown?: string;
}

export const MAX_ITEMS = 10;
