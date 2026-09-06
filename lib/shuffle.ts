import { Idea, IDEA_BANK } from "./ideas";
import { Profile, Hemisphere } from "./types";

function currentSeasonFor(hemisphere: Hemisphere | undefined): "summer" | "winter" | "either" {
  if (!hemisphere || hemisphere === "tropical") return "either";
  const month = new Date().getMonth(); // 0-11
  const isNorthernSummer = month >= 4 && month <= 8; // May-Sep
  if (hemisphere === "northern") return isNorthernSummer ? "summer" : "winter";
  return isNorthernSummer ? "winter" : "summer"; // southern hemisphere is flipped
}

/**
 * Weighted-random idea pick. Profile is entirely optional — with no profile,
 * every idea in the bank has an equal shot. Filters only ever narrow toward
 * relevance, they never block a manually typed list item.
 */
export function pickIdea(profile: Profile | undefined, exclude: string[] = []): Idea | undefined {
  const pool = IDEA_BANK.filter((i) => !exclude.includes(i.id));
  if (pool.length === 0) return undefined;
  if (!profile || !profile.onboardingComplete) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const season = currentSeasonFor(profile.hemisphere);

  const weighted = pool.map((idea) => {
    let weight = 1;

    if (profile.hasKids === true && !idea.kidFriendly) weight *= 0.15;
    if (profile.hasKids === false && idea.kidFriendly) weight *= 0.9;

    if (profile.locality === "city" && !idea.settings.includes("city") && !idea.settings.includes("indoors")) {
      weight *= 0.5;
    }
    if (profile.locality === "rural" && idea.settings.includes("city") && !idea.settings.includes("outdoors") && !idea.settings.includes("rural")) {
      weight *= 0.6;
    }

    if (profile.preferFree && idea.cost === "costs-money") weight *= 0.25;

    if (idea.season !== "either" && idea.season !== season) weight *= 0.35;

    return { idea, weight };
  });

  const total = weighted.reduce((sum, w) => sum + w.weight, 0);
  let r = Math.random() * total;
  for (const { idea, weight } of weighted) {
    r -= weight;
    if (r <= 0) return idea;
  }
  return weighted[weighted.length - 1]?.idea;
}
