"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getIdentity } from "@/lib/storage";
import { sharingConfigured, previewInvite, acceptInvite } from "@/lib/sync";
import NamePrompt from "@/components/NamePrompt";

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <Join />
    </Suspense>
  );
}

type State =
  | { kind: "loading" }
  | { kind: "unconfigured" }
  | { kind: "missing" }
  | { kind: "own" }
  | { kind: "ready"; inviter: { id: string; name: string } }
  | { kind: "error" };

function Join() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get("code") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(getIdentity().name);
    if (!sharingConfigured()) return setState({ kind: "unconfigured" });
    if (!code) return setState({ kind: "missing" });
    previewInvite(code)
      .then((inviter) => setState(inviter ? { kind: "ready", inviter } : { kind: "missing" }))
      .catch(() => setState({ kind: "error" }));
  }, [code]);

  async function accept(shareBack: boolean) {
    setBusy(true);
    const result = await acceptInvite(code, shareBack);
    setBusy(false);
    if (result === "ok") router.replace("/friends");
    else if (result === "own") setState({ kind: "own" });
    else if (result === "missing") setState({ kind: "missing" });
    else setState({ kind: "error" });
  }

  const who = state.kind === "ready" ? state.inviter.name || "A friend" : "";

  return (
    <>
      <header className="pb-6 pt-10">
        <h1 className="text-[34px] font-semibold leading-none tracking-tight">
          {state.kind === "ready" ? `${who} is sharing` : "An invite"}
        </h1>
        <p className="mt-4 text-[15px] text-muted">
          {state.kind === "ready" && `${who} wants you to see their Monthly 10s list.`}
          {state.kind === "loading" && "Just a moment."}
          {state.kind === "unconfigured" && "Sharing isn't switched on for this copy of the app."}
          {state.kind === "missing" && "That link has expired or isn't quite right."}
          {state.kind === "own" && "That's your own link. Send it to someone else."}
          {state.kind === "error" && "Couldn't reach the sharing service just now."}
        </p>
      </header>

      {state.kind === "ready" && name !== null && !name && <NamePrompt onDone={setName} />}

      {state.kind === "ready" && name && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => accept(true)}
            className="w-full rounded-full bg-fg py-4 text-[17px] font-semibold text-bg transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            See theirs and share mine back
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => accept(false)}
            className="w-full rounded-full border border-line py-4 text-[17px] font-semibold text-fg transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            Just see theirs
          </button>
          <p className="mt-2 text-center text-sm text-muted">
            Sharing back means {who} can see your list and what you tick off. You can stop any time from
            Friends.
          </p>
        </div>
      )}

      {state.kind !== "ready" && state.kind !== "loading" && (
        <Link href="/" className="text-[15px] font-medium text-accent">
          Back to this month
        </Link>
      )}
    </>
  );
}
