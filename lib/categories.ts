import { Category, ListItem } from "./types";

// -----------------------------------------------------------------------
// Local, zero-cost theme detection. No API, no model: a prefix map for
// items that came from the idea bank, and ordered keyword rules for
// anything typed by hand. It runs at read time, so past months are themed
// retroactively and rules can improve without a data migration. The user
// can override any item's theme; that override is stored on the item.
// -----------------------------------------------------------------------

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "social", label: "Social" },
  { id: "active", label: "Active" },
  { id: "food", label: "Food" },
  { id: "nature", label: "Nature" },
  { id: "explore", label: "Explore" },
  { id: "learning", label: "Learning" },
  { id: "creative", label: "Creative" },
  { id: "rest", label: "Rest" },
  { id: "play", label: "Play" },
  { id: "other", label: "Other" },
];

const LABELS: Record<Category, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label])
) as Record<Category, string>;

export function categoryLabel(c: Category): string {
  return LABELS[c];
}

const IDEA_PREFIX: Record<string, Category> = {
  food: "food",
  nature: "nature",
  connect: "social",
  rest: "rest",
  learn: "learning",
  adv: "explore",
  play: "play",
};

// Order matters: earlier rules win. People-words first (they're the
// strongest signal), then concrete nouns, then broader verbs.
const RULES: [Category, RegExp][] = [
  [
    "social",
    /\b(friends?|mates?|family|mum|mom|dad|parents?|grand(?:ma|pa|parent)s?|gran|nana?|sister|brother|cousin|neighbou?rs?|co-?workers?|colleagues?|classmates?|partner|date night|call|phone|ring|text|message|voice memo|letter|postcard|write to|invite|host|hang ?out|catch ?up|reconnect|game night|(?:dinner|coffee|lunch|drinks) with|compliment|stranger|introduce|thank|appreciate|kind(?:ness)?)\b/i,
  ],
  [
    "food",
    /\b(cook(?:ing)?|recipes?|bak(?:e|ing)|meal|dinner|lunch|breakfast|brunch|restaurant|caf[eé]|coffee|tea|chai|cocoa|snacks?|dessert|cookies?|cake|bread|sourdough|pasta|ramen|pizza|tacos?|sushi|curry|soup|grill|bbq|barbecue|picnic|farmers? market|food|eat|ice cream|popsicles?|cuisine|dish|drink)\b/i,
  ],
  [
    "nature",
    /\b(sunrise|sunset|stars?|stargaz\w*|moon|sky|beach|ocean|sea|lake|river|creek|waterfall|forest|woods|trail|park|gardens?|gardening|plants?|trees?|flowers?|birds?|nature|rain|snow\w*|leaves|kite|camp(?:ing)?|tent|greenhouse|botanical|ducks?)\b/i,
  ],
  [
    "active",
    /\b(run(?:ning)?|jog(?:ging)?|gym|work ?out|exercise|yoga|stretch(?:ing)?|pilates|swim(?:ming)?|bike|cycl(?:e|ing)|hik(?:e|ing)|climb(?:ing)?|walk(?:ing)?|steps|lift(?:ing)?|weights|danc(?:e|ing)|sport|tennis|football|soccer|basketball|skat(?:e|ing)|ski(?:ing)?|surf(?:ing)?|kayak(?:ing)?|paddle|rowing|5k|10k|marathon|park ?run)\b/i,
  ],
  [
    "explore",
    /\b(visit|explore|day trip|road trip|trip|travel|somewhere new|never been|new (?:place|part|town|route|neighbou?rhood|spot|cafe)|museum|gallery|library|tourist|transit|train|bus|ferry|wander|get lost|different route|long way|bookstore|shop|fair|festival|open mic|event)\b/i,
  ],
  [
    "learning",
    /\b(learn(?:ing)?|read(?:ing)?|books?|novel|study|course|class|tutorial|lesson|practi[cs]e|language|phrases?|documentary|podcast|history|facts?|skill|chords?|instrument|guitar|piano|ukulele|cod(?:e|ing)|trick)\b/i,
  ],
  [
    "creative",
    /\b(draw(?:ing)?|paint(?:ing)?|sketch|colou?r(?:ing)?|writ(?:e|ing)|journal(?:ing)?|poem|poetry|story|crafts?|knit|crochet|sew|pottery|ceramics|photos?|photograph\w*|camera|music|song|sing(?:ing)?|karaoke|compose|build|make|diy|origami|collage|scrapbook|design)\b/i,
  ],
  [
    "rest",
    /\b(nap|sleep(?: in)?|rest|relax|bath|shower|p[yj]jamas?|pjs?|no plans|nothing|slow|quiet|unplug|phone-?free|no phones?|screen-?free|screens|candle|early night|bed|lie (?:in|down)|declutter|tidy|clean|organi[sz]e|donate|say no|meditat\w*|breath\w*|mindful\w*|self-?care|spa|massage|movie|film|tv|show|series|watch)\b/i,
  ],
  [
    "play",
    /\b(games?|board game|puzzle|jigsaw|video game|lego|fort|pillow|scavenger|treasure hunt|water balloon|silly|play(?:ing)?|playground|toys?|kids?|children|arcade|bowling|mini ?golf|trampoline|zoo|aquarium|farm|petting|pet|dog|cat)\b/i,
  ],
  // Weak signals last: "outside" on its own shouldn't beat "read" or "cook".
  ["nature", /\b(outside|outdoors?|fresh air|sun(?:shine)?)\b/i],
];

export function autoCategory(text: string, ideaId?: string): Category {
  if (ideaId) {
    const prefix = ideaId.split("-")[0];
    if (IDEA_PREFIX[prefix]) return IDEA_PREFIX[prefix];
  }
  for (const [category, re] of RULES) {
    if (re.test(text)) return category;
  }
  return "other";
}

/** The theme that applies to an item: the user's override if set, else detected. */
export function categoryOf(item: ListItem): Category {
  return item.category ?? autoCategory(item.text, item.ideaId);
}
