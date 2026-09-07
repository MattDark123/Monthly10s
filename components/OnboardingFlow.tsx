"use client";

import { useState } from "react";
import { Profile, LocalityType, Hemisphere } from "@/lib/types";

const LOCALITY: { value: LocalityType; label: string; hint: string }[] = [
  { value: "city", label: "City", hint: "Dense, lots nearby" },
  { value: "suburb", label: "Suburb", hint: "A bit of both" },
  { value: "rural", label: "Rural", hint: "Open space, fewer venues" },
];

const CLIMATE: { value: Hemisphere; label: string; hint: string }[] = [
  { value: "northern", label: "Northern hemisphere", hint: "Summer around July" },
  { value: "southern", label: "Southern hemisphere", hint: "Summer around January" },
  { value: "tropical", label: "No real seasons", hint: "Warm most of the year" },
];

const STEPS = 4;

export default function OnboardingFlow({
  initial,
  onComplete,
  onSkip,
}: {
  initial?: Profile;
  onComplete: (profile: Profile) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Profile>(initial ?? { onboardingComplete: false });
  const [geo, setGeo] = useState<"idle" | "locating" | "done" | "error">("idle");

  const next = () => setStep((s) => Math.min(s + 1, STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  function useMyLocation() {
    if (!("geolocation" in navigator)) return setGeo("error");
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const hemisphere: Hemisphere =
          Math.abs(lat) < 23.5 ? "tropical" : lat >= 0 ? "northern" : "southern";
        setDraft((d) => ({ ...d, hemisphere }));
        setGeo("done");
      },
      () => setGeo("error"),
      { timeout: 8000 }
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-bg">
      <div className="safe-top safe-bottom mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-6 pt-6">
        {/* header row: back + progress + skip */}
        <div className="flex h-10 items-center justify-between">
          <button
            type="button"
            onClick={back}
            className={`-ml-2 px-2 py-1 text-sm font-medium text-muted ${step === 0 ? "invisible" : ""}`}
          >
            Back
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: STEPS }).map((_, i) => (
              <span
                key={i}
                className={`h-1 w-5 rounded-full transition-colors ${i <= step ? "bg-fg" : "bg-fg/15"}`}
              />
            ))}
          </div>
          <button type="button" onClick={onSkip} className="-mr-2 px-2 py-1 text-sm font-medium text-muted">
            Skip
          </button>
        </div>

        <div key={step} className="animate-fade-up flex flex-1 flex-col pt-10">
          {step === 0 && (
            <>
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
                Want better ideas?
              </h1>
              <p className="mt-3 text-[17px] leading-relaxed text-muted">
                Three quick questions help the idea button suggest things that fit your life.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                Your answers stay on this device and are never sent anywhere.
              </p>
              <div className="mt-auto">
                <PrimaryButton onClick={next}>Let&apos;s go</PrimaryButton>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="text-[28px] font-semibold leading-tight tracking-tight">Where are you, roughly?</h2>
              <p className="mt-2 text-[15px] text-muted">No address — just the general vibe.</p>
              <ChoiceList
                options={LOCALITY}
                value={draft.locality}
                onSelect={(v) => {
                  setDraft((d) => ({ ...d, locality: v }));
                  setTimeout(next, 120);
                }}
              />
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-[28px] font-semibold leading-tight tracking-tight">What&apos;s your climate?</h2>
              <p className="mt-2 text-[15px] text-muted">So we skip snowball fights in July.</p>
              <ChoiceList
                options={CLIMATE}
                value={draft.hemisphere}
                onSelect={(v) => {
                  setDraft((d) => ({ ...d, hemisphere: v }));
                  setTimeout(next, 120);
                }}
              />
              <button
                type="button"
                onClick={useMyLocation}
                className="mt-4 self-start py-2 text-[15px] font-medium text-accent"
              >
                {geo === "locating" ? "Checking…" : "Use my location instead"}
              </button>
              {geo === "error" && (
                <p className="text-sm text-muted">Couldn&apos;t get a location — pick one above.</p>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-[28px] font-semibold leading-tight tracking-tight">Last few things</h2>
              <div className="mt-8 divide-y divide-line border-y border-line">
                <YesNoRow label="Kids at home" value={draft.hasKids} onChange={(v) => setDraft((d) => ({ ...d, hasKids: v }))} />
                <YesNoRow label="A pet" value={draft.hasPet} onChange={(v) => setDraft((d) => ({ ...d, hasPet: v }))} />
                <YesNoRow
                  label="Prefer free things"
                  value={draft.preferFree}
                  onChange={(v) => setDraft((d) => ({ ...d, preferFree: v }))}
                />
              </div>
              <div className="mt-auto">
                <PrimaryButton onClick={() => onComplete({ ...draft, onboardingComplete: true })}>Done</PrimaryButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full bg-fg py-4 text-[17px] font-semibold text-bg transition-transform active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

function ChoiceList<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: { value: T; label: string; hint: string }[];
  value: T | undefined;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="mt-8 divide-y divide-line border-y border-line">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className="flex w-full items-center justify-between py-4 text-left transition-opacity active:opacity-60"
          >
            <span>
              <span className="block text-[17px] font-medium">{opt.label}</span>
              <span className="block text-sm text-muted">{opt.hint}</span>
            </span>
            <span
              className={`h-5 w-5 rounded-full border-[1.5px] transition-colors ${
                selected ? "border-accent bg-accent" : "border-fg/25"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}

function YesNoRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-[17px] font-medium">{label}</span>
      <div className="flex overflow-hidden rounded-full border border-line">
        {[
          { v: true, l: "Yes" },
          { v: false, l: "No" },
        ].map(({ v, l }) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange(v)}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              value === v ? "bg-fg text-bg" : "text-muted"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
