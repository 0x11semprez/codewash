# Performance report

Issue [#18](https://github.com/EpitechBachelorPromo2028/B-ING-300-PAR-3-1-codewash-21/issues/18): *Improve performance (loading screen and UX snappiness)*, tracked in this repository as [#18](https://github.com/0x11semprez/codewash/issues/18).

**Compared versions**

| Label | Commit | Description |
| --- | --- | --- |
| Before | `866aaff` | No loading screen, no lazy loading |
| After | `666c69c` + Web Vitals reporting | All changes described below |

## Summary

| Section of the issue | Status | Outcome |
| --- | --- | --- |
| Loading screen | Done | Full-screen loader with progress percentage, critical asset preloading, measured load time |
| Performance profiling | Done | Profiles captured, re-renders identified, FCP baseline recorded |
| Optimizations | Done | Memoization, lazy-loaded drawers, modals and mini-games, extracted global CSS, deferred images |
| Measurement | Partial | Bundle sizes and Web Vitals reporting done; the two Lighthouse series are not comparable yet (different themes) |
| Tests | Done | Loading screen, loading gate, preload, lazy components, Web Vitals and a regression guard |

**Key results**

- Startup JavaScript went from 392.46 kB to 319.27 kB (-18.6 %).
- Closed drawers no longer render: 0 of 13 commits, against 8 of 10 before.
- The maximum React commit dropped from 277.2 ms to 142.3 ms (development build).
- No end-user speedup is claimed: the Lighthouse figures do not show one (see section 4.3).

Every figure is labeled with the tool and environment that produced it.

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

### Limitations

- A loading screen improves feedback; it does not by itself make startup faster. Preloading too many assets would delay the menu, which is why only startup-critical assets are blocking.
- A theme with missing images (see [DEBT-021](../DEBT.md#debt-021-missing-theme-assets-p2-open)) makes the loader report failed critical images until the player presses **Continue**.

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

### Earlier baseline

First Contentful Paint measured at 522.9 ms: one Opera GX measurement on the production preview (`http://localhost:4173/`). A single measurement is an indication, not a benchmark. Lighthouse figures for the earlier hook extraction are in [section 4.3](#43-earlier-lighthouse-runs-debt-001).

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
| `React.lazy` + `Suspense` for mini-games | Six mini-games bundled with the skill card | `src/components/skills/SkillCard.jsx` |

### Behavior details

- Drawers and modals mount on first use. A drawer stays mounted after its first opening so its slide transition is preserved.
- Memoized drawers skip updates while closed and use current props when opened.
- Global styles load during the loading screen, before the game is revealed.
- Startup sprite preloading is limited to the sprites visible in the initial viewport.

### Code splitting per skill type

Each mini-game in `src/components/skills/games/` is loaded with `React.lazy` from `SkillCard.jsx` and rendered inside a `Suspense` boundary. It becomes its own chunk (0.95 kB to 3.31 kB, 0.62 kB to 1.58 kB gzipped) fetched on the first battle of that skill. The saving at startup is small because the games are tiny; no speedup is claimed.

While adding this, a missing import of `GameErrorBoundary` in `SkillCard.jsx` was found and fixed: it made every battle crash with `GameErrorBoundary is not defined`.

---

## 4. Measurement

### 4.1 Bundle size

Source: `npx vite build` on each commit. Sizes are deterministic, so they do not depend on machine load.

| Asset | Before | After | Change |
| --- | --- | --- | --- |
| Entry JS (loaded at startup) | 392.46 kB (111.41 kB gzip) | 319.27 kB (99.57 kB gzip) | -18.6 % (-10.6 % gzip) |
| Global CSS (loaded at startup) | 61.18 kB (10.99 kB gzip) | 62.89 kB (11.59 kB gzip) | +2.8 % |
| Global styles extracted | inlined in JS | `GlobalStyles.css`, 22.24 kB (4.83 kB gzip) | loaded under the loading screen |
| Drawers (Settings, Menu, Cosmetics) | in the entry JS | 3 lazy chunks, 28.05 kB (9.05 kB gzip) in total | fetched on first opening |
| Modals (Reset, Bug report) | in the entry JS | 2 lazy chunks, 3.74 kB (1.61 kB gzip) in total | fetched on first use |
| Mini-games (6) | in the entry JS | 6 lazy chunks, 10.94 kB (5.76 kB gzip) in total | fetched on the first battle of each skill |

The JavaScript needed to show the menu shrank by about 73 kB (12 kB gzipped). The CSS grew slightly: the global stylesheet is not smaller overall, it is only loaded in a controlled place.

### 4.2 Lighthouse

Chrome DevTools, Performance category only, production preview (`http://localhost:4173`), same browser and window, three runs per version. This Lighthouse version does not report Time to Interactive; Total Blocking Time (TBT) is reported instead.

| Run | Version | Theme | Score | FCP | LCP | TBT | CLS | Speed Index |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Before | spy | 96 | 0.5 s | 1.0 s | 80 ms | 0.082 | 1.1 s |
| 2 | Before | spy | 97 | 0.5 s | 0.9 s | 90 ms | 0.062 | 0.8 s |
| 3 | Before | spy | 97 | 0.5 s | 1.0 s | 70 ms | 0.071 | 0.8 s |
| 1 | After | minecraft | 73 | 0.7 s | 3.1 s | 60 ms | 0 | 14.4 s |
| 2 | After | minecraft | 73 | 0.7 s | 2.5 s | 20 ms | 0.202 | 1.9 s |
| 3 | After | minecraft | 75 | 0.6 s | 3.1 s | 10 ms | 0 | 3.1 s |

Medians:

| Metric | Before | After |
| --- | --- | --- |
| Score | 97 | 73 |
| FCP | 0.5 s | 0.7 s |
| LCP | 1.0 s | 3.1 s |
| TBT | 80 ms | 20 ms |
| CLS | 0.071 | 0 |
| Speed Index | 0.8 s | 3.1 s |

### 4.3 Earlier Lighthouse runs (DEBT-001)

These figures were first recorded in the debt register. They measure the hook extraction from DEBT-001 ([#45](https://github.com/0x11semprez/codewash/pull/45)), before the loading screen existed. They were taken with the Lighthouse CLI (`npx lighthouse http://localhost:4173 --only-categories=performance`) on a build served with `npx serve dist`. The theme was not recorded.

The tool, the server and the code differ from section 4.2. Do not compare the two tables.

| Metric | Before DEBT-001 | After DEBT-001 |
| --- | --- | --- |
| Performance score | 71 | 90 |
| FCP | 1.5 s | 1.6 s |
| LCP | 1.5 s | 1.6 s |
| TBT | 2,390 ms | 380 ms |
| CLS | 0 | 0.033 |
| Speed Index | 1.8 s | 1.6 s |
| Main thread work | 8.1 s | 4.8 s |
| JS execution | 0.8 s | 0.5 s |
| JS bundle | 363 kB (102 kB gzip) | 363 kB |

Before the extraction, `App.jsx` held 32 `useState` and 12 `useEffect` calls in one component. Any state change re-rendered the whole tree, including closed drawers. The team attributes the TBT drop to the extraction: each hook now owns its own state.

### 4.4 Web Vitals reporting

`src/utils/webVitals.js` reports FCP, LCP and CLS with a Core Web Vitals rating (good / needs-improvement / poor). `src/main.jsx` logs each metric to the console, for example `[web-vitals] FCP: 523 (good)`.

| Metric | When it is reported |
| --- | --- |
| FCP | As soon as the browser measures it |
| LCP | When the page is hidden, using the last observed value |
| CLS | When the page is hidden, summing shifts without recent user input |

Browsers without `PerformanceObserver`, or without support for an entry type, are ignored silently.

---

### 4.5 Background music

The six background tracks were uncompressed WAV files (44.1 kHz, stereo, 1411 kb/s). They are now MP3 files encoded with LAME (VBR quality 2, about 132 kb/s), with the same durations.

| Track | Duration | WAV | MP3 |
| --- | --- | --- | --- |
| `calm1` | 4:20 | 43.8 MB | 4.1 MB |
| `calm2` | n/a | 33.9 MB | 3.5 MB |
| `calm3` | n/a | 38.7 MB | 3.6 MB |
| `piano1` | n/a | 11.5 MB | 0.7 MB |
| `piano2` | n/a | 15.1 MB | 1.4 MB |
| `piano3` | 4:41 | 47.3 MB | 4.5 MB |
| **Total** | | **191 MB** | **18 MB** |

The music is about 10.6 times smaller. Durations were compared for two tracks only, and sound quality was not compared by ear. `soundManager.test.js` checks that the track list points to existing MP3 files under 10 MB.

### 4.7 Animated sprites

The 32 animated GIFs under `public/assets/` are now lossless animated WebP files. The pixels, the transparency and the loop are unchanged. [ADR-011](../adr/011-animated-webp-instead-of-gif.md) explains the choice.

| Folder | GIF | WebP | Change |
| --- | --- | --- | --- |
| `items/` | 18.03 MB | 12.25 MB | -32 % |
| `mobs/` | 16.78 MB | 8.29 MB | -51 % |
| `skills/` | 2.10 MB | 0.99 MB | -53 % |
| **Total** | **36.91 MB** | **21.53 MB** | **-42 %** |

Sizes per file, largest first:

| File | GIF | WebP | Change |
| --- | --- | --- | --- |
| `items/book` | 12.21 MB | 8.34 MB | -32 % |
| `items/axe` | 2.15 MB | 1.42 MB | -34 % |
| `items/hoe` | 2.07 MB | 1.42 MB | -31 % |
| `mobs/axolotl/axolotl_pink` | 1.81 MB | 0.82 MB | -55 % |
| `mobs/boss/enderdragon` | 1.29 MB | 1.05 MB | -18 % |
| `items/chests/ender_chest` | 1.25 MB | 0.84 MB | -33 % |
| `mobs/axolotl/axolotl_red` | 1.11 MB | 0.54 MB | -52 % |
| `mobs/axolotl/axolotl_green` | 1.10 MB | 0.56 MB | -49 % |
| `mobs/axolotl/axolotl_brown` | 1.09 MB | 0.51 MB | -53 % |
| `mobs/axolotl/axolotl_black` | 1.08 MB | 0.47 MB | -57 % |
| `mobs/axolotl/axolotl_cyan` | 1.05 MB | 0.46 MB | -56 % |
| `mobs/axolotl/axolotl_gold` | 1.00 MB | 0.45 MB | -55 % |
| `mobs/hostile/blaze` | 0.99 MB | 0.36 MB | -64 % |
| `skills/axolotl_blue` | 0.96 MB | 0.44 MB | -54 % |
| `mobs/axolotl/axolotl_blue` | 0.96 MB | 0.44 MB | -54 % |
| `skills/reading_icon` | 0.92 MB | 0.47 MB | -49 % |
| `mobs/friendly/glowsquid` | 0.75 MB | 0.25 MB | -67 % |
| `mobs/hostile/phantom` | 0.74 MB | 0.58 MB | -22 % |
| `mobs/hostile/guardian` | 0.64 MB | 0.34 MB | -46 % |
| `mobs/miniboss/elderguardian` | 0.64 MB | 0.36 MB | -43 % |
| `mobs/boss/warden` | 0.60 MB | 0.27 MB | -55 % |
| `mobs/hostile/ghast` | 0.47 MB | 0.09 MB | -82 % |
| `mobs/friendly/squid` | 0.46 MB | 0.11 MB | -76 % |
| `mobs/friendly/nautilus` | 0.43 MB | 0.05 MB | -88 % |
| `skills/cleaning_icon` | 0.22 MB | 0.08 MB | -64 % |
| `mobs/friendly/strider` | 0.19 MB | 0.06 MB | -68 % |
| `items/chests/trapped_chest` | 0.19 MB | 0.11 MB | -44 % |
| `mobs/friendly/allay` | 0.18 MB | 0.09 MB | -48 % |
| `items/chests/chest` | 0.17 MB | 0.11 MB | -35 % |
| `mobs/friendly/frog` | 0.07 MB | 0.04 MB | -46 % |
| `mobs/friendly/camel` | 0.06 MB | 0.04 MB | -33 % |
| `mobs/friendly/sniffer` | 0.06 MB | 0.03 MB | -44 % |

Sizes are in decimal megabytes, read from the files on disk. For `frog`, `warden` and `enderdragon`, every decoded frame was compared with the GIF and matched exactly. The frame count and delays matched too.

`skills/axolotl_blue` is not used by the code. It was converted with the others.

The item animations stay large. `book` has 1,650 frames and `axe` and `hoe` have 825 each, so even lossless WebP stays above 1 MB. A shorter loop would help more than a new format.

#### How to rerun the conversion

You need `ffmpeg` built with `libwebp`. Check with `ffmpeg -hide_banner -encoders | grep libwebp_anim`.

```sh
node scripts/convert-gifs.mjs --dry-run   # print sizes, change nothing
node scripts/convert-gifs.mjs             # convert, delete the GIFs, update the paths in src/
npx vitest run --dir src src/__tests__/assetPaths.test.js
```

The script converts every GIF under `public/`. It keeps a GIF when the WebP would be bigger. Run it again after adding a new animated sprite.

---

## 5. Automated tests

| Test file | What it protects |
| --- | --- |
| `LoadingScreen.test.jsx` | Percentage, progress bar, ready state and the Continue action |
| `LoadingGate.test.jsx` | Reveal after loading, failed-image path, preload crash |
| `preloadStartupAssets.test.js` | Progress up to 100 %, failed images listed, corrupted saved theme |
| `app.test.jsx` | Drawers not mounted before first opening, lazy loading on click, startup toast |
| `SkillCard.test.jsx` | The right mini-game renders after loading for each skill, and none outside a battle |
| `webVitals.test.js` | Metric collection and rating thresholds |
| `performanceBudget.test.js` | Drawers, modals and mini-games stay lazy; global styles stay out of `App`; images stay lazy by default |
| `assetPaths.test.js` | Every image path in `gameData` and `src/` exists under `public/`, except the four known missing theme images ([#53](https://github.com/0x11semprez/codewash/issues/53)); no referenced GIF is above 200 KB |

---

## 6. Open work

| Item | Notes |
| --- | --- |
| Fair Lighthouse comparison | Select the `minecraft` theme, check out `866aaff`, run `npm run build && npm run preview`, run Lighthouse three times, then add the figures to section 4.2 |
| Investigate the higher LCP after the change | Compare the "after" build with and without the loading screen |
| Add the missing theme images | Tracked as [DEBT-021](../DEBT.md#debt-021-missing-theme-assets-p2-open) |
