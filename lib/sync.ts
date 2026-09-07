import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ListItem, MonthList } from "./types";
import { monthKey, nextMonthKey } from "./date";
import { getIdentity, saveIdentity, getMonth } from "./storage";

// -----------------------------------------------------------------------
// Optional sharing layer on Supabase (free tier). Everything here is a
// no-op unless NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
// are set, and nothing is uploaded until the user shares with someone.
// Each device signs in anonymously — no email, no password — and row-level
// security (supabase/schema.sql) means a friend can only read a month you
// have explicitly shared with them.
// -----------------------------------------------------------------------

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function sharingConfigured(): boolean {
  return Boolean(URL && KEY);
}

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!sharingConfigured() || typeof window === "undefined") return null;
  if (!client) client = createClient(URL!, KEY!);
  return client;
}

/** Sign in anonymously the first time; sessions persist on the device. */
export async function ensureUser(): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  const { data } = await c.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const res = await c.auth.signInAnonymously();
  return res.data.user?.id ?? null;
}

export async function saveName(name: string): Promise<void> {
  const trimmed = name.trim().slice(0, 40);
  saveIdentity({ ...getIdentity(), name: trimmed });
  const c = getClient();
  const uid = await ensureUser();
  if (!c || !uid) return;
  await c.from("profiles").upsert({ id: uid, name: trimmed, updated_at: new Date().toISOString() });
}

// ---- Months ----

function isShareable(key: string): boolean {
  const current = monthKey();
  return key === current || key === nextMonthKey(current);
}

/** Upload one month. Only the current and next month are ever sent, and
 * only once sharing has been turned on by sharing with someone. */
export async function pushMonth(list: MonthList): Promise<void> {
  if (!getIdentity().sharingEnabled || !isShareable(list.monthKey)) return;
  const c = getClient();
  const uid = await ensureUser();
  if (!c || !uid) return;
  await c.from("months").upsert({
    user_id: uid,
    month_key: list.monthKey,
    items: list.items,
    updated_at: new Date().toISOString(),
  });
}

export async function pushShareableMonths(): Promise<void> {
  const current = monthKey();
  await pushMonth(getMonth(current));
  await pushMonth(getMonth(nextMonthKey(current)));
}

async function enableSharing(): Promise<void> {
  const id = getIdentity();
  if (!id.sharingEnabled) saveIdentity({ ...id, sharingEnabled: true });
  await pushShareableMonths();
}

// ---- Friends ----

export interface Friend {
  id: string;
  name: string;
  /** they let me see their list */
  sharesWithMe: boolean;
  /** I let them see mine */
  iShareWith: boolean;
  month?: { monthKey: string; items: ListItem[]; updatedAt: string };
}

export async function listFriends(): Promise<Friend[]> {
  const c = getClient();
  const uid = await ensureUser();
  if (!c || !uid) return [];

  const { data: shares } = await c
    .from("shares")
    .select("from_user,to_user")
    .or(`from_user.eq.${uid},to_user.eq.${uid}`);
  const rows = (shares ?? []) as { from_user: string; to_user: string }[];
  if (rows.length === 0) return [];

  const map = new Map<string, Friend>();
  const touch = (id: string) => {
    if (!map.has(id)) map.set(id, { id, name: "", sharesWithMe: false, iShareWith: false });
    return map.get(id)!;
  };
  for (const r of rows) {
    if (r.from_user === uid) touch(r.to_user).iShareWith = true;
    else touch(r.from_user).sharesWithMe = true;
  }
  const ids = Array.from(map.keys());

  const [{ data: profiles }, { data: months }] = await Promise.all([
    c.from("profiles").select("id,name").in("id", ids),
    c
      .from("months")
      .select("user_id,month_key,items,updated_at")
      .in("user_id", ids)
      .eq("month_key", monthKey()),
  ]);
  for (const p of (profiles ?? []) as { id: string; name: string }[]) {
    const f = map.get(p.id);
    if (f) f.name = p.name;
  }
  for (const m of (months ?? []) as {
    user_id: string;
    month_key: string;
    items: ListItem[];
    updated_at: string;
  }[]) {
    const f = map.get(m.user_id);
    if (f && f.sharesWithMe) f.month = { monthKey: m.month_key, items: m.items, updatedAt: m.updated_at };
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function setShareWith(friendId: string, on: boolean): Promise<void> {
  const c = getClient();
  const uid = await ensureUser();
  if (!c || !uid) return;
  if (on) {
    await c.from("shares").upsert({ from_user: uid, to_user: friendId });
    await enableSharing();
  } else {
    await c.from("shares").delete().eq("from_user", uid).eq("to_user", friendId);
  }
}

export async function removeFriend(friendId: string): Promise<void> {
  const c = getClient();
  const uid = await ensureUser();
  if (!c || !uid) return;
  await c
    .from("shares")
    .delete()
    .or(
      `and(from_user.eq.${uid},to_user.eq.${friendId}),and(from_user.eq.${friendId},to_user.eq.${uid})`
    );
}

/** Take my list back from everyone and delete what I'd uploaded. Friends
 * who share with me are unaffected. */
export async function stopSharingAll(): Promise<void> {
  const c = getClient();
  const uid = await ensureUser();
  if (c && uid) {
    await c.from("shares").delete().eq("from_user", uid);
    await c.from("months").delete().eq("user_id", uid);
  }
  saveIdentity({ ...getIdentity(), sharingEnabled: false });
}

/** Forget this device's anonymous account (used by "Erase everything"). */
export async function signOutSharing(): Promise<void> {
  const c = getClient();
  if (!c) return;
  await c.auth.signOut();
}

// ---- Invites ----

function randomCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** Make a link that lets a friend see my list (and offer theirs back). */
export async function createInvite(): Promise<string | null> {
  const c = getClient();
  const uid = await ensureUser();
  if (!c || !uid) return null;
  const code = randomCode();
  const { error } = await c.from("invites").insert({ code, from_user: uid });
  if (error) return null;
  await enableSharing();
  return `${window.location.origin}/join?code=${code}`;
}

export async function previewInvite(code: string): Promise<{ id: string; name: string } | null> {
  const c = getClient();
  if (!c || !(await ensureUser())) return null;
  const { data } = await c.rpc("invite_preview", { p_code: code });
  const row = (data as { inviter_id: string; inviter_name: string }[] | null)?.[0];
  return row ? { id: row.inviter_id, name: row.inviter_name } : null;
}

export async function acceptInvite(
  code: string,
  shareBack: boolean
): Promise<"ok" | "own" | "missing" | "error"> {
  const c = getClient();
  if (!c || !(await ensureUser())) return "error";
  const { error } = await c.rpc("accept_invite", { p_code: code, p_share_back: shareBack });
  if (error) {
    if (/own invite/i.test(error.message)) return "own";
    if (/not found/i.test(error.message)) return "missing";
    return "error";
  }
  if (shareBack) await enableSharing();
  return "ok";
}
