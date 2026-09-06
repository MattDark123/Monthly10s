"use client";

import { useState } from "react";
import { Profile, LocalityType, Hemisphere } from "@/lib/types";

const LOCALITY_OPTIONS: { value: LocalityType; label: string; icon: string }[] = [
  { value: "city", label: "City", icon: "🏙️" },
  { value: "suburb", label: "Suburb", icon: "🏘️" },
  { value: "rural", label: "Rural", icon: "🌾" },
];

const HEMISPHERE_OPTIONS: { value: Hemisphere; label: string; icon: string }[] = [
  { value: "northern", label: "Northern hemisphere", icon: "🧭" },
  { value: "southern", label: "Southern hemisphere", icon: "🧭" },
  { value: "tropical", label: "Tropical / no real seasons", icon: "🌴" },
];

type Step = 0 | 1 | 2 | 3;

export default function OnboardingFlow({
  onComplete,
  onSkip,
}: {
  onComplete: (profile: Profile) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<Profile>({ onboardingComplete: false });
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "done" | "error">("idle");

  function next() {
    setStep((s) => (Math.min(s + 1, 3) as Step));
  }

  function finish(final: Profile) {
    onComplete({ ...final, onboardingComplete: true });
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const hemisphere: Hemisphere = pos.coords.latitude >= 0 ? "northern" : "southern";
        setDraft((d) => ({ ...d, hemisphere }));
        setGeoStatus("done");
      },
      () => setGeoStatus("error"),
      { timeout: 8000 }
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-cream">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-14">
        <div className="mb-8 flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-tangerine" : "bg-black/10"}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-1 flex-col animate-fade-in">
            <h1 className="text-2xl font-bold">Want a few better suggestions?</h1>
            <p className="mt-3 text-ink/70">
              Answer a couple of quick questions and the &ldquo;idea shuffle&rdquo; button will lean toward
              things that actually fit your life. Totally optional — this stays on your device and is
              never sent anywhere.
            </p>
            <div className="mt-auto flex flex-col gap-3">
              <button
                onClick={next}
                className="w-full rounded-full bg-tangerine py-3 text-base font-semibold text-white active:scale-95"
              >
                Sure, let&apos;s go
              </button>
              <button onClick={onSkip} className="w-full py-2 text-sm font-medium text-ink/50">
                Skip for now
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-1 flex-col animate-fade-in">
            <h2 className="text-xl font-bold">Where do you spend most of your time?</h2>
            <p className="mt-2 text-sm text-ink/60">Just a general vibe — no address needed.</p>
            <div className="mt-6 flex flex-col gap-3">
              {LOCALITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setDraft((d) => ({ ...d, locality: opt.value }));
                    next();
                  }}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-base font-medium active:scale-[0.98] ${
                    draft.locality === opt.value ? "border-tangerine bg-tangerine/10" : "border-black/10"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={onSkip} className="mt-auto py-2 text-sm font-medium text-ink/50">
              Skip the rest
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-1 flex-col animate-fade-in">
            <h2 className="text-xl font-bold">Roughly what climate?</h2>
            <p className="mt-2 text-sm text-ink/60">
              Helps us suggest season-appropriate ideas (e.g. no snowball fights in July).
            </p>
            <div className="mt-6 flex flex-col gap-3">
              {HEMISPHERE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setDraft((d) => ({ ...d, hemisphere: opt.value }));
                    next();
                  }}
                  className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-4 text-left text-base font-medium active:scale-[0.98] ${
                    draft.hemisphere === opt.value ? "border-tangerine bg-tangerine/10" : "border-black/10"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={useMyLocation}
              className="mt-4 rounded-full bg-white py-2.5 text-sm font-semibold text-ink/70 active:scale-95"
            >
              {geoStatus === "locating" ? "Locating…" : "📍 Use my location instead"}
            </button>
            {geoStatus === "done" && (
              <p className="mt-2 text-center text-sm text-sage">Got it, thanks!</p>
            )}
            {geoStatus === "error" && (
              <p className="mt-2 text-center text-sm text-ink/50">
                Couldn&apos;t get your location — pick one above instead.
              </p>
            )}
            <button onClick={onSkip} className="mt-auto py-2 text-sm font-medium text-ink/50">
              Skip the rest
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-1 flex-col animate-fade-in">
            <h2 className="text-xl font-bold">A couple more quick things</h2>
            <div className="mt-6 flex flex-col gap-3">
              <ToggleRow
                label="Kids at home?"
                value={draft.hasKids}
                onChange={(v) => setDraft((d) => ({ ...d, hasKids: v }))}
              />
              <ToggleRow
                label="Have a pet?"
                value={draft.hasPet}
                onChange={(v) => setDraft((d) => ({ ...d, hasPet: v }))}
              />
              <ToggleRow
                label="Prefer free activities?"
                value={draft.preferFree}
                onChange={(v) => setDraft((d) => ({ ...d, preferFree: v }))}
              />
            </div>
            <p className="mt-6 text-center text-xs text-ink/40">
              All of this stays on your device — it&apos;s never sent anywhere.
            </p>
            <button
              onClick={() => finish(draft)}
              className="mt-auto w-full rounded-full bg-tangerine py-3 text-base font-semibold text-white active:scale-95"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border-2 border-black/10 px-4 py-3">
      <span className="text-base font-medium">{label}</span>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(true)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            value === true ? "bg-tangerine text-white" : "bg-black/5 text-ink/60"
          }`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange(false)}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
            value === false ? "bg-tangerine text-white" : "bg-black/5 text-ink/60"
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}
