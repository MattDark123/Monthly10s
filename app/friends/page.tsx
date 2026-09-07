"use client";

import { useCallback, useEffect, useState } from "react";
import { getIdentity } from "@/lib/storage";
import {
  sharingConfigured,
  listFriends,
  createInvite,
  setShareWith,
  removeFriend,
  Friend,
} from "@/lib/sync";
import { monthName, monthKey } from "@/lib/date";
import NamePrompt from "@/components/NamePrompt";
import ProgressDots from "@/components/ProgressDots";
import Toggle from "@/components/Toggle";
import { CheckIcon, ChevronIcon, LinkIcon } from "@/components/Icons";

export default function FriendsPage() {
  const configured = sharingConfigured();
  const [name, setName] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ url: string; copied: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setFriends(await listFriends());
      setError(null);
    } catch {
      setError("Couldn't reach the sharing service just now.");
      setFriends((f) => f ?? []);
    }
  }, []);

  useEffect(() => {
    setName(getIdentity().name);
    if (!configured) return;
    void refresh();
    const onVisible = () => document.visibilityState === "visible" && void refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [configured, refresh]);

  async function makeInvite() {
    setBusy(true);
    const url = await createInvite();
    setBusy(false);
    if (!url) {
      setError("Couldn't make a link just now. Try again in a moment.");
      return;
    }
    setInvite({ url, copied: false });
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Monthly 10s",
          text: `${getIdentity().name} is sharing their Monthly 10s list with you.`,
          url,
        });
      } catch {
        /* user dismissed the sheet — the link stays on screen */
      }
    }
  }

  async function copyInvite() {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.url);
      setInvite({ ...invite, copied: true });
    } catch {
      /* clipboard blocked; the link is visible to copy by hand */
    }
  }

  if (name === null) return null;

  return (
    <>
      <header className="pb-6 pt-10">
        <h1 className="text-[34px] font-semibold leading-none tracking-tight">Friends</h1>
        <p className="mt-4 text-[15px] text-muted">
          {configured
            ? "See how each other's months are going. Only what you choose to share."
            : "Sharing isn't switched on for this copy of the app."}
        </p>
      </header>

      {!configured && (
        <div className="rounded-2xl border border-line bg-card p-4 text-[15px] leading-relaxed text-muted">
          Your list stays on this device. To share with friends, whoever hosts this app connects a free
          Supabase project and adds two environment variables. The README walks through it in a few
          minutes.
        </div>
      )}

      {configured && !name && <NamePrompt onDone={setName} />}

      {configured && name && (
        <>
          <button
            type="button"
            onClick={makeInvite}
            disabled={busy}
            className="flex w-full items-center justify-between rounded-2xl bg-fg px-5 py-4 text-left text-bg transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <span>
              <span className="block text-[17px] font-semibold">{busy ? "Making a link…" : "Share with a friend"}</span>
              <span className="block text-sm opacity-70">They see your list. They can share theirs back.</span>
            </span>
            <LinkIcon size={22} />
          </button>

          {invite && (
            <div className="animate-fade-up mt-3 rounded-2xl border border-line bg-card p-4">
              <p className="text-sm text-muted">Send this link however you like. It works for 30 days.</p>
              <p className="mt-2 break-all text-[15px]">{invite.url}</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={copyInvite}
                  className="rounded-full bg-fg/5 px-4 py-1.5 text-sm font-semibold text-fg active:scale-95"
                >
                  {invite.copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={() => setInvite(null)}
                  className="rounded-full px-4 py-1.5 text-sm font-semibold text-muted"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-muted">{error}</p>}

          <h2 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-wider text-muted">
            {monthName(monthKey())}
          </h2>

          {friends === null && <p className="text-sm text-muted">Loading…</p>}
          {friends && friends.length === 0 && (
            <p className="text-[15px] leading-relaxed text-muted">
              No friends yet. Share a link above, or open one a friend sent you.
            </p>
          )}

          {friends && friends.length > 0 && (
            <ul className="border-t border-line">
              {friends.map((f) => {
                const open = openId === f.id;
                const items = f.month?.items ?? [];
                const done = items.filter((i) => i.done).length;
                return (
                  <li key={f.id} className="border-b border-line">
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : f.id)}
                      className="flex w-full items-center justify-between gap-4 py-4 text-left transition-opacity active:opacity-60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[17px] font-medium">{f.name || "Friend"}</span>
                        <span className="block text-sm text-muted">
                          {f.sharesWithMe
                            ? items.length === 0
                              ? "Nothing on their list yet."
                              : friendLine(done, items.length)
                            : "Not sharing their list with you."}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        {f.sharesWithMe && items.length > 0 && <ProgressDots done={done} total={items.length} />}
                        <ChevronIcon
                          size={18}
                          className={`text-muted transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                        />
                      </span>
                    </button>

                    {open && (
                      <div className="animate-fade-in pb-4">
                        {f.sharesWithMe && items.length > 0 && (
                          <ul className="mb-4">
                            {items.map((item) => (
                              <li key={item.id} className="flex items-center gap-4 py-1.5">
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                                    item.done ? "border-accent bg-accent text-white" : "border-fg/20"
                                  }`}
                                >
                                  {item.done && <CheckIcon size={11} />}
                                </span>
                                <span className={`text-[15px] ${item.done ? "text-fg" : "text-muted"}`}>
                                  {item.text}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[15px]">They can see your list</span>
                          <Toggle
                            checked={f.iShareWith}
                            label={`Share your list with ${f.name || "this friend"}`}
                            onChange={async (v) => {
                              setFriends((fs) => fs?.map((x) => (x.id === f.id ? { ...x, iShareWith: v } : x)) ?? null);
                              await setShareWith(f.id, v);
                              void refresh();
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await removeFriend(f.id);
                            setOpenId(null);
                            void refresh();
                          }}
                          className="mt-3 text-sm font-medium text-muted active:text-accent"
                        >
                          Remove friend
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}

function friendLine(done: number, total: number): string {
  if (done === 0) return `${total} on the list, none ticked yet.`;
  if (done === total) return `All ${total} done. Look at them go.`;
  return `${done} of ${total} done.`;
}
