# Monthly 10s

At the start of each month, write down 10 casual, low-stakes things you'd
like to do — try a recipe, call a friend, watch a sunrise. There are **zero
consequences** for not finishing. This app's whole job is to make it
effortless to write the list, see it often, and tick things off as they
happen.

Built as a free, installable PWA: Next.js (App Router) + TypeScript +
Tailwind, with all data stored **on your device only** (`localStorage`). No
login, no backend, no cost.

## Features

- Up to 10 items per month, inline add/edit/delete, big tap targets.
- Two layouts, switchable from the Month header or Settings: a plain list,
  or a 3x3 bingo card with a free centre square. Tap a tile to tick it,
  hold to edit. Completing a line gets a quiet word of encouragement; a
  full house gets a brief burst of confetti (skipped under
  `prefers-reduced-motion`).
- "Stuck? Tap for an idea" — a bank of ~100 low-stakes ideas, tagged by
  kid-friendliness, setting, cost, and season.
- An optional, fully skippable local-only profile (locality, climate,
  kids/pets, prefer-free) used only to weight idea suggestions — it never
  blocks a manually typed item and is never sent anywhere.
- A new-month banner + a real local notification, plus one optional
  mid-month nudge (never more).
- Unfinished items can roll forward. By default anything unticked at the
  end of a month joins the next month's list on first open (a banner says
  what came along); Settings can switch that to "ask me" (pick which ones)
  or "let go". The old month is left as it was, so the look-back stays
  honest, and only the immediately previous month is ever considered.
- Plan next month from inside this one: a small switch on the Month tab
  opens next month's list, and it simply becomes the current list when the
  month rolls over.
- A "Look back" tab: past months as they were, plus gentle insights — how
  many things you do in a typical month, and a per-theme breakdown showing
  which kinds of things you lean toward, which reliably happen, and which
  tend to slip.
- Themes (social, active, food, nature, explore, learning, creative, rest,
  play) are detected on-device by a small keyword classifier — no API — and
  you can override any item's theme while editing it.
- Installable to the home screen on iOS and Android, and fully usable
  offline after first load.
- Minimal, one-accent interface that follows the system light/dark
  setting, respects iOS safe areas when installed, and honours
  `prefers-reduced-motion`.

## Local dev setup

Requires Node 18+.

```bash
npm install
npm run dev
```

Open http://localhost:3000. The service worker only registers over
`https://` or `localhost`, so local dev works out of the box.

To regenerate the app icons (plain PNGs, generated with a small Node script,
no image libraries needed):

```bash
npm run generate-icons
```

## How the data layer works

Everything reads/writes through `lib/storage.ts`, a small abstraction over
`localStorage` (lists, the optional profile, and notification settings). No
component talks to `localStorage` directly. If you ever want cross-device
sync later, you can swap the implementation behind that same module for a
free-tier backend (e.g. Supabase) without touching any UI code — that's the
only reason the abstraction exists; v1 ships with zero backend.

## How notification scheduling works

There is no push server — everything is scheduled **locally**, via the
Notifications API and a service worker (`public/sw.js`). Concretely:

1. **In-app banner (always works):** every time the app opens, it checks
   today's date against your reminder-day setting and shows a friendly
   banner if it's time for a new list, or for the one optional mid-month
   nudge.
2. **Real OS notification (best effort while the app isn't open):** the
   same date check also runs inside the service worker. On Chrome/Android,
   the service worker can register for the
   [Periodic Background Sync API](https://developer.chrome.com/blog/periodic-background-sync),
   which wakes it up roughly once a day even if the app is closed, so the
   notification can fire without you opening the app.
3. **Fallback everywhere else:** browsers without Periodic Background
   Sync (notably Safari/iOS) don't support waking a closed app on a
   schedule at all without a push server. On those platforms the
   notification instead fires **the moment you next open the app** on or
   after the reminder day — the in-app banner from step 1 is guaranteed to
   catch it either way.

Because a service worker cannot read `localStorage`, your reminder-day and
mid-month-nudge settings are mirrored into a small IndexedDB store
(`lib/idb.ts` / the matching vanilla-JS copy inside `public/sw.js`)
whenever you change them in Settings. Your actual lists and profile answers
stay in `localStorage` only.

**iOS specifics:** Safari requires the app to be **added to the home
screen** before notification permission can even be requested, and needs
**iOS 16.4 or later**. If you open the app straight in Safari (not
installed), the browser will simply not offer notification permission —
this is an iOS platform restriction, not a bug in the app. The in-app
banner still works perfectly in the browser either way.

## Deploying for free (Vercel)

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Go to [vercel.com](https://vercel.com), sign in, and click **Add New →
   Project**, then import the repo.
3. Framework preset: Vercel auto-detects Next.js — no config needed. Leave
   the build command (`next build`) and output settings as default.
4. Click **Deploy**. You'll get a free `*.vercel.app` URL (a custom domain
   is also free to attach).

That's it — no environment variables, no database, no paid add-ons.
(Netlify or Cloudflare Pages both also support Next.js on their free
tiers if you'd rather use one of those instead; Vercel is documented here
since it's the reference deploy target for Next.js apps.)

### Installing to your home screen after deploying

**iPhone (Safari, iOS 16.4+):**
1. Open your deployed URL in Safari.
2. Tap the Share icon → **Add to Home Screen** → **Add**.
3. Open the app from the new home screen icon, then allow notifications
   when prompted (Settings → Notifications toggle, in the app).

**Android (Chrome):**
1. Open your deployed URL in Chrome.
2. Tap the ⋮ menu → **Add to Home screen** (or **Install app** if Chrome
   shows an install banner automatically).
3. Open the installed app and allow notifications when prompted.

## Cost

This entire stack runs indefinitely on free tiers at low/personal-scale
usage:

- **Hosting (Vercel Hobby):** free, no card required for a personal
  project at this traffic level.
- **Data storage:** `localStorage`/IndexedDB in the visitor's own browser —
  there is no database to pay for.
- **Notifications:** the browser's built-in Notifications API — no push
  service, no per-message cost.
- **Idea bank / profile filtering:** static data shipped with the app, no
  API calls, no geocoding/maps/weather services (the optional "use my
  location" button only reads the browser's free built-in Geolocation API
  to guess hemisphere — it never calls a paid service).

There are no hidden costs anywhere in this stack.

## Explicitly out of scope (v1)

Accounts/login, social sharing, cloud sync, streak-shaming stats, and any
paid geocoding/maps/weather APIs. See "How notification scheduling works"
above for why push-server-backed notifications aren't included either.
