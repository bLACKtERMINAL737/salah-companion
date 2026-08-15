# Salah Companion

A premium, offline-first Islamic prayer companion built with Next.js 15. Live prayer times, a Qibla compass, a Hijri calendar, Ramadan mode, a mosque finder, and an AI assistant — installable as a PWA on Mac, iPhone, Android, and desktop.

---

## What actually works right now vs. what needs your own keys

Being upfront about this, since a lot of "AI-built app" writeups gloss over it:

**Works immediately, no setup, no API keys:**
- Prayer times (calculated on-device with the `adhan` library — accurate and fully offline once loaded)
- Qibla compass, Hijri calendar, Islamic events, Ramadan countdown + fasting tracker
- Mosque finder (OpenStreetMap — free, keyless)
- Dark/light theme, English/Arabic/Bangla with proper RTL
- PWA install, offline caching, in-app notification scheduling while the app is open

**Works once you add your own free-tier keys (5–10 minutes each, instructions below):**
- Account sign-in + cross-device settings sync — needs a Firebase project
- **True background** Azan/reminders (arriving with the app fully closed) — needs Firebase Cloud Messaging + deploying the included Cloud Function
- Salah AI chat — needs an OpenAI API key

**Needs you to supply your own files:**
- Azan audio — no recordings are bundled (see [Azan audio](#azan-audio) below for why, and where to get some)

**Not independently verified in this build:**
- A Lighthouse 90+ score — the architecture is built for it (self-hosted fonts, offline caching, minimal JS), but run `npx lighthouse` against your actual deployment to confirm rather than taking that on faith.

---

## Tech stack

Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · Serwist (PWA/service worker) · Firebase (Auth + Firestore + Cloud Messaging + Cloud Functions) · `adhan` (prayer time math) · OpenAI (Salah AI)

---

## Folder structure

```
salah-companion/
├── app/                     # Routes (App Router) — one folder per page + api/chat
├── components/              # UI, grouped by feature area
├── context/                 # AuthContext, SettingsContext (theme/lang/prefs)
├── hooks/                   # usePrayerData, useNow, useNotificationScheduler
├── lib/                     # All non-React logic — prayer math, hijri, i18n,
│                             # firebase, geocoding, mosques, azan, notifications, storage
├── public/
│   ├── icons/                # Generated app icons (scripts/generate-icons.py)
│   └── audio/                 # Empty — add your own azan mp3s here
├── functions/                 # Firebase Cloud Function for real background push
├── chrome-extension/          # Optional bonus: a Chrome new-tab override
├── firebase.json, firestore.rules, firestore.indexes.json
└── scripts/generate-icons.py
```

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in whichever sections you want active
npm run dev
```

Open http://localhost:3000 — prayer times, Qibla, calendar, Ramadan mode, and the mosque finder all work immediately with zero configuration.

> **Turbopack note:** don't run `next dev --turbo` with this setup — Serwist's service-worker build uses webpack, and mixing the two throws a config conflict. Plain `next dev` / `next build` (the default scripts here) are webpack and work fine.

---

## Environment variables

All of these are optional — the app degrades gracefully without any of them. Copy `.env.example` to `.env.local` and fill in what you want.

| Variable | What it enables | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_*` (6 vars) | Sign-in + cross-device settings sync | Firebase Console → Project settings → General → Your apps |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Background push notifications | Firebase Console → Project settings → Cloud Messaging → Web configuration |
| `OPENAI_API_KEY` | Salah AI chat | platform.openai.com/api-keys (server-side only — never sent to the browser) |
| `OPENAI_MODEL` | Which model Salah AI uses | See the note in `app/api/chat/route.ts` — OpenAI's lineup moves fast, check platform.openai.com/docs/models before deploying rather than trusting a hardcoded default |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Reserved if you want to swap the mosque finder from OpenStreetMap to Google Places | Google Cloud Console (Maps JavaScript + Places API) |

---

## Firebase setup (accounts, sync, and background push)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com) (free Spark plan covers this app's scale for Auth/Firestore; Cloud Functions' scheduler needs the pay-as-you-go **Blaze** plan, but stays within or near the free monthly quota for personal use).
2. **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
3. **Firestore Database** → create in production mode. Then deploy the included rules so users can only read/write their own document:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add            # pick your project
   firebase deploy --only firestore:rules
   ```
4. Copy the six `NEXT_PUBLIC_FIREBASE_*` values from Project settings → General into `.env.local`.
5. **For background push:** Project settings → Cloud Messaging → Web configuration → Generate key pair → copy into `NEXT_PUBLIC_FIREBASE_VAPID_KEY`. Then deploy the Cloud Function:
   ```bash
   cd functions
   npm install
   cd ..
   firebase deploy --only functions
   ```
   That function (`functions/src/index.ts`) runs every minute, computes each opted-in user's prayer times server-side, and sends the Azan even with their browser fully closed. Read the comment at the top of that file — it's honest about the scale trade-offs of the simple version included here.

Without steps 4–5, the app runs entirely locally — no error states, sign-in just shows a "not configured" message instead of breaking anything.

---

## Salah AI (OpenAI)

Add `OPENAI_API_KEY` to `.env.local`. That's it — `app/api/chat/route.ts` keeps the key server-side and streams responses to the chat UI. The system prompt asks the model to note where scholars/madhabs differ rather than picking one silently, and to point people to a qualified local scholar for anything personal or high-stakes — worth reading and adjusting to your own comfort level before shipping this to real users.

---

## Azan audio

No azan recordings are bundled on purpose — a recitation is someone's performance with its own rights, and bundling one without checking its license isn't a default this build picks for you. Three files are expected:

```
public/audio/azan-makkah.mp3
public/audio/azan-madinah.mp3
public/audio/azan-chime.mp3
```
(edit `AZAN_VOICES` in `lib/azan.ts` if you'd rather use different names/counts)

A couple of starting points if you want ready-made options — **check each one's license yourself before shipping**, this isn't a substitute for that:
- Search GitHub for existing open-source adhan-audio collections intended for reuse in prayer apps.
- freesound.org has Creative Commons–licensed adhan recordings, filterable by exact license.
- Or record/commission your own.

Until you add files, the Settings preview button and scheduled playback fail silently (the on-screen notification still fires — only the sound is missing).

---

## Deploying to Vercel

```bash
npm i -g vercel
vercel
```
Or connect the repo at vercel.com/new. Then in the Vercel project's **Settings → Environment Variables**, add whichever variables from `.env.example` you're using (same names, no quotes). Redeploy after adding them.

---

## Installing as an app

**On a Mac:** macOS doesn't have a "home screen" the way iOS does, so ignore any instructions that say otherwise:
- **Safari (Sonoma or later):** open the deployed site → File menu → **Add to Dock**. It launches in its own window, in the Dock, like a native app.
- **Chrome:** open the site → click the install icon (a monitor-with-arrow icon) in the address bar → **Install**.

**On iPhone/iPad (Safari):** open the site → Share button → **Add to Home Screen**. It installs as a standalone app icon with no browser chrome.

**On Android (Chrome):** open the site → menu (⋮) → **Install app** (or you'll see an automatic install banner).

All three read the same `public/manifest.json` and icons — nothing platform-specific to configure beyond deploying the app over HTTPS (Vercel gives you this by default).

---

## Bonus: Chrome New Tab extension

`chrome-extension/` is a separate, minimal artifact — a real browser extension is a different kind of build from a PWA page, so this isn't the same code as the main dashboard, just similar in spirit. It's deliberately small (vanilla JS, no build step, calls the same public Aladhan API directly) rather than a full port of the app.

To try it: edit `APP_URL` at the top of `chrome-extension/newtab.js` to point at your deployed app, then in Chrome go to `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select the `chrome-extension/` folder.

---

## Known limitations, stated plainly

- **Background notifications** need the Firebase Cloud Function above deployed and a signed-in user; without that, reminders only fire while the app/tab is open (see `hooks/useNotificationScheduler.ts`).
- **Hijri dates are calculated (tabular)**, not based on local moon-sighting announcements — actual observance in your country can land a day earlier or later. The calendar page says this too, not just this README.
- **The i18n system is a simple key→string dictionary**, not full ICU MessageFormat — a few notification strings are built by concatenating translated fragments, which reads slightly less naturally in Arabic/Bangla than hand-written per-locale sentences would. Good enough to ship, worth revisiting if this grows.
- **This sandbox couldn't make live network calls** to verify a few third-party API response shapes byte-for-byte (Open-Meteo geocoding, BigDataCloud reverse geocoding) — they're implemented defensively (try/catch, fail to an empty/default result) precisely because of that; skim `lib/geocoding.ts`'s top comment and spot-check against a real request before relying on it heavily.
- Free tiers of Overpass (mosque search) and Open-Meteo (city search) are shared community services — fine for individual use, but add caching if you expect real traffic.

---

## Attribution

Prayer time math: [`adhan`](https://github.com/batoulapps/adhan-js) (Batoul Apps). Mosque data: © OpenStreetMap contributors, via the Overpass API. City search: Open-Meteo Geocoding. Reverse geocoding: BigDataCloud. Quran text/translation: alquran.cloud.
