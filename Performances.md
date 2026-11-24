# Performance report

Issue [#12](https://github.com/EpitechBachelorPromo2028/B-ING-300-PAR-3-1-codewash-21/issues/12): *Improve performance (loading screen and UX snappiness)*.

## Summary

| Section of the issue | Status | Outcome |
| --- | --- | --- |
| Loading screen | Done | Full-screen loader with progress percentage, critical asset preloading, measured load time |
| Performance profiling | Done, one gap | Profiles captured and re-renders identified; Time to Interactive baseline still missing |
| Optimizations | Done | Memoization, lazy-loaded drawers and modals, extracted global CSS, deferred images |
| Measurement | Open | No after-change FCP, TTI or Lighthouse score yet |
| Tests | Partial | Loading screen, loading gate, preload and lazy drawers are tested; regression test is open |

No production speedup is claimed in this document. Every figure below is labeled with the tool and environment that produced it.

---

## 1. Loading screen

### Problem

At startup the React tree rendered directly. Players had no feedback while images and sounds loaded, and the main menu could appear with missing visuals.

### Solution

A full-screen loader is displayed over the game while critical assets are preloaded. The game is revealed through a short opacity transition once every critical asset has settled.

- A percentage and a bordered progress bar reflect the number of loaded assets.
- The loader exposes `role="progressbar"` with `aria-valuenow` for assistive technologies.
- If a critical image fails, the loader shows a **Continue** action instead of blocking the player.
- The elapsed load time is passed to the game, which unlocks the `So... So fast !?` achievement and shows the duration in its toast.
- Reduced-motion preferences are honored in the loader styles.

### Preloaded assets

| Category | Blocking | Content |
| --- | --- | --- |
| Images | Yes | Selected theme background, logo, card back, six skill icons, mob sprites inside the initial viewport |
| UI sounds | No | Eight short sound effects, warmed in the background |
| Background music | No | Not preloaded: the six WAV files weigh about 201 MB |

### Files

| File | Role |
| --- | --- |
| `src/components/ui/LoadingScreen.jsx` | Loader view and accessible progress indicator |
| `src/components/LoadingGate.jsx` | Coordinates preload state, global styles and elapsed time |
| `src/utils/preloadStartupAssets.js` | Loads critical images and warms optional sounds |
| `src/main.jsx` | Mounts the gate inside the error boundary |
| `src/App.jsx`, `src/constants/achievements.js`, `src/components/ui/AchievementToast.jsx` | Startup achievement and its toast |
| `src/index.css` | Loader styling and reduced-motion handling |
| `src/utils/soundManager.js` | Sound URLs aligned with files in `public/assets/sounds` |

### Limitation

A loading screen improves feedback; it does not by itself make startup faster. Preloading too many assets would delay the menu, which is why only startup-critical assets are blocking.

---

## 2. Performance profiling

### Method

- **Tool:** React DevTools Profiler on the Vite development server (`http://localhost:5173/`).
- **Scenario:** captures made around the *Skip* / *Manual Success* interaction.
- **Caveat:** durations are development-mode render times, not end-to-end input latency.

### Findings

| Capture | Commits | Median | Maximum | Drawers rendered |
| --- | --- | --- | --- | --- |
| Before optimizations | 10 | 79.35 ms | 277.2 ms | In 8 of 10 commits (`MenuDrawer`, `CosmeticsDrawer`, `SettingsDrawer`, profile cards) |
| After optimizations (`scripts/profil Skip.json`) | 13 | 85.0 ms | 142.3 ms | In none; `App` and `SkillCard` still render |

Reading the table:

- The maximum commit time dropped from 277.2 ms to 142.3 ms, and closed drawers no longer render.
- The median did not improve (79.35 ms to 85.0 ms) and the commit counts differ (10 vs 13 after two Skip / Manual Success presses), so the two captures are not strictly comparable.
- The captures do not show that players perceived a delay, so no user-visible slowdown is claimed.

### Root cause identified

Closed drawers stayed mounted to preserve their slide transitions, so every update of the parent re-rendered them. The Settings drawer alone rendered three `ProfileCard` instances.

### Baseline metrics

| Metric | Value | Source |
| --- | --- | --- |
| First Contentful Paint | 522.9 ms | One Opera GX measurement on the production preview (`http://localhost:4173/`) |
| Time to Interactive | Not measured | Outstanding |

A single measurement is an indication, not a benchmark. Lighthouse figures for the earlier hook extraction are in [docs/DEBT.md](docs/DEBT.md) (section 3.2).

---

## 3. Optimizations

### Changes

| Optimization | Problem solved | Files |
| --- | --- | --- |
| Memoized closed drawers | Closed drawers re-rendered on every parent update | `SettingsDrawer.jsx`, `MenuDrawer.jsx`, `CosmeticsDrawer.jsx` |
| `React.memo` on display components | Re-renders with unchanged props | `SafeImage.jsx`, `PixelHeart.jsx`, `MobWithAura.jsx` |
| `React.lazy` + `Suspense` for drawers and modals | All drawers and modals were in the startup import graph | `src/App.jsx` |
| `useMemo` on the carousel items | List rebuilt on every render | `src/App.jsx` |
| Global CSS extracted to a stylesheet | Styles injected from a JSX component, including a font `@import` on each mount | `src/components/ui/GlobalStyles.css`, `LoadingGate.jsx` |
| Deferred off-screen images | Images outside the viewport loaded eagerly | `SafeImage.jsx`, `PhantomEvent.jsx`, `preloadStartupAssets.js` |

### Behavior details

- Drawers and modals mount on first use. A drawer stays mounted after its first opening so its slide transition is preserved.
- Memoized drawers skip updates while closed and use current props when opened.
- Global styles load during the loading screen, before the game is revealed.
- Startup sprite preloading is limited to the sprites visible in the initial viewport.

### Code splitting per skill type

Applied. Each mini-game in `src/components/skills/games/` is loaded with `React.lazy` from `SkillCard.jsx` and rendered inside a `Suspense` boundary, so it becomes its own chunk (0.95 kB to 3.31 kB, 0.62 kB to 1.58 kB gzipped) fetched on the first battle of that skill. The saving at startup is small because the games are tiny; no speedup is claimed. `SkillCard.test.jsx` checks that each skill renders the right game after loading.

---

## Open work

| Item | Notes |
| --- | --- |
| After-change FCP, TTI and Lighthouse score | Use `npm run build && npm run preview`, several runs, same machine as the baseline |
| Time to Interactive baseline | Required to close the profiling section |
| Web Vitals reporting | Not implemented |
| Performance regression test | Optional in the issue |
