# 🎮 MiniGames — Creative Extension

### Branch: `creative-extension`

**PWA & Offline · Interactive Audio · Engineering Tooling**

Curator presentation · 5–10 minutes

---

## 1. The Idea

The base MiniGames task is a polished SPA: home page, library, game details, auth, API integration.

For the creative extension I picked three improvements that make the app feel like a **real product** rather than a demo:

1. **PWA & Offline Support** — install it, open it without internet.
2. **Interactive Audio** — a sound layer built with the Web Audio API.
3. **Engineering Tooling** — ESLint, Husky.

> Motivation: a game library is something people revisit. Installing it, hearing it respond, and trusting it not to break is exactly what separates a course project from a shippable app.

---

## 2. What the Branch Adds

| Area           | Delivered                                                               |
| -------------- | ----------------------------------------------------------------------- |
| Offline        | Hand-written service worker, three cache buckets, offline fallback page |
| Installability | Web app manifest, maskable icons, in-app install button                 |
| Audio          | 24 synthesized UI sounds, zero audio files, wired across the UI         |
| Polish         | Reduced-motion support, graceful degradation when APIs are missing      |

Everything ships in `creative-extension`; `main` still holds only the initial Vite template.

---

## 3. Extension 1 — PWA & Offline

**What users get**

- "Add to Home Screen" on desktop and mobile.
- The app opens in its own window without browser chrome.
- Previously visited pages and assets load instantly from cache.
- A branded "You are offline" page instead of a browser error.
- New versions activate automatically and clean old caches.

**Why a custom service worker?**

A third-party PWA plugin hides the caching logic. Writing `public/sw.js` by hand meant controlling exactly what is cached, when it is refreshed, and what happens when the network fails.

---

## 4. How the Service Worker Works

```text
install   → precache app shell, manifest, icons, offline page
activate  → delete caches from older versions, claim clients
fetch     → route by request type
            ├─ navigate  → network-first → page cache → shell → offline.html
            ├─ same-origin asset → stale-while-revalidate
            └─ API GET → network-first, cached fallback, 503 JSON
```

- Cache names are versioned (`minigames-v2-*`), so a deploy is an atomic switch.
- `skipWaiting()` + `clients.claim()` keep the update path invisible to the user.
- `Promise.allSettled` during install: one failed icon cannot break installation.
- API responses are cached too, so the library still renders offline after a first visit.

---

## 5. Extension 2 — Interactive Audio

**The constraint:** no audio assets, no libraries, no bundle bloat.

**The approach:** every sound is a short list of notes — oscillator or filtered noise, pitch glide, lowpass, envelope — scheduled through the Web Audio API.

- **24 sounds** such as `boot`, `hush`, `tick`, `paid`, `landed`, `sigh`, `whisk`.
- Sounds are **data**, not files: a few hundred bytes each, rendered at runtime.
- `play(name, { volume, pitch })` is the single entry point used across the UI.
- The same scheduling code works in a live `AudioContext` and an `OfflineAudioContext`.

**Where it is used:** menu toggles, modal open/close, navigation, auth actions, form feedback, snackbars — quiet cues, not noise.

---

## 6. Extension 3 — Engineering Tooling

- router, URL state, layout and header;
- home sections, library filters, pagination, game cards and details;
- auth forms, session lifecycle, API service, Firebase wrapper;
- snackbar, async content, service-worker-adjacent logic.

**Gates**

- ESLint with `--max-warnings=0` and the `unicorn` ruleset.
- Prettier formatting checks.
- Husky `commit-msg` hook enforcing `type: subject` conventional commits.
- Husky `pre-push` hook blocking lint/format regressions.
- TypeScript strict mode with `noUnusedLocals` and `noUnusedParameters`.

---

## 7. Demo Script (5 minutes)

1. Open the deployed app — show the header and the **Install app** button.
2. Install it; show the standalone window and the app icon.
3. Browse to `/library`, open a game, play with filters and pagination.
4. Click around: menu, dialogs, auth — point out the subtle sound cues.
5. Open DevTools → Application:
   - show `manifest.webmanifest` and its icons;
   - show the service worker as **activated**;
   - show `minigames-v2-shell / assets / api` caches.
6. Switch DevTools to **Offline** and reload:
   - app shell boots;
   - `/library` still opens;
   - cached API data renders; uncached data returns a clear offline message.
7. Return online — the app picks up where it left off.
8. Run `npm test` to show the suite in action.

---

## 8. Technologies Used

| Layer    | Choice                                   | Why                                       |
| -------- | ---------------------------------------- | ----------------------------------------- |
| Language | TypeScript (strict)                      | Safety across DOM, API and auth code      |
| Build    | Vite                                     | Fast dev server, simple production output |
| Styling  | SCSS                                     | Tokens and mixins without a UI framework  |
| PWA      | Native Service Worker + Web App Manifest | Full control, no plugin                   |
| Audio    | Web Audio API                            | No assets, tiny payload, dynamic control  |
| Auth     | Firebase Authentication                  | Email/password + Google out of the box    |
| Tests    | Vitest + jsdom + V8 coverage             | Same toolchain as Vite                    |
| Quality  | ESLint, Prettier, Husky                  | Enforced automatically, not by discipline |

---

## 9. Challenges & How I Solved Them

**"`'self' is not defined`" in the service worker**

- ESLint did not know worker globals.
- Used `globalThis` (identical scope in a worker) and added a dedicated config block with `globals.serviceworker` + `globals.browser`. Lint is clean and behaviour is unchanged.

**Cache invalidation**

- A cached shell can serve an old build forever.
- Solution: versioned cache prefixes, cleanup on `activate`, and `skipWaiting` / `clients.claim`.

**Offline navigation vs. 404s**

- A network-first handler that returns any response would show a broken page on failures.
- Solution: an explicit fallback chain — page cache → app shell → `offline.html`.

**Audio in tests and autoplay policies**

- jsdom has no `AudioContext`, and browsers block audio before a gesture.
- Solution: `play()` exits early when the API is missing, and every call is attached to a real user interaction.

---

## 10. Results

| Check                     | Result                             |
| ------------------------- | ---------------------------------- |
| Service worker            | activated, scope `/`               |
| Cache buckets             | `shell`, `assets`, `api` populated |
| Offline reload            | app shell restored                 |
| `/library` offline        | opens with cached data             |
| Install prompt            | visible on desktop and mobile menu |
| Browser console           | no errors                          |
| `tsc --noEmit`            | ✅                                 |
| `npm run lint`            | ✅ 0 warnings                      |
| `npx eslint public/sw.js` | ✅                                 |
| `npm run build`           | ✅                                 |

---

## 11. What I Learned

- Service workers are a **product decision**, not just a technical one: cache strategy defines what "offline" means.
- The Web Audio API is far more expressive than `<audio>` — sound can be data.
- Tooling pays for itself: the lint gate caught the worker-globals bug before review.
- `globalThis` is the portable way to write code that runs in both windows and workers.

---

## 12. What I Would Do Next

- A "New version available — Reload" prompt instead of silent activation.
- Background sync queue for offline favourites and comments.
- A sound settings toggle with persisted preference (`prefers-reduced-motion` already respected).
- Lighthouse PWA audit in CI, plus a GitHub Actions pipeline.
- Dark / retro themes built on the existing SCSS tokens.

---

## 13. Summary

On `creative-extension` I took a working SPA and made it:

**installable, usable offline, audibly alive, and guarded by automated quality gates.**

The base app shows the features. The extension shows how they hold up in the real world.
