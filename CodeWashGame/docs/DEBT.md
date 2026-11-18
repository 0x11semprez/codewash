# Technical Debt Register — CodeWashGame

> Living document. Updated as debt is identified, resolved, or reprioritized.
> Last updated: 2026-11-18

---

## 1. Codebase Map

### Module Overview

| Module | Path | Purpose | Lines |
|--------|------|---------|-------|
| **App** (root component) | `src/App.jsx` | Game orchestrator: state, battles, profiles, challenges, carousel, voice recognition | 1,492 |
| **GlobalStyles** | `src/components/ui/GlobalStyles.jsx` | All CSS-in-JSX animations, themes, auras | 1,302 |
| **SkillCard** | `src/components/skills/SkillCard.jsx` | Individual skill battle UI: patterns, math, reading, writing, memory, axolotl | 778 |
| **gameData** | `src/constants/gameData.jsx` | Static data: skills config, themes, mobs, items, homophones | 416 |
| **gameUtils** | `src/utils/gameUtils.js` | Game logic: mob generation, XP/damage/health calculations, challenge generation | 363 |
| **achievements** | `src/constants/achievements.js` | Achievement definitions (tiered) | 318 |
| **CosmeticsDrawer** | `src/components/drawers/CosmeticsDrawer.jsx` | Cosmetics shop: borders, effects, themes | 322 |
| **soundManager** | `src/utils/soundManager.js` | Audio: BGM manager, SFX playback, mob sounds | 287 |
| **MenuDrawer** | `src/components/drawers/MenuDrawer.jsx` | Stats, achievements, skill overview panel | 262 |
| **achievementUtils** | `src/utils/achievementUtils.js` | Achievement unlock logic, tier progress, stats tracking | 217 |
| **PhantomEvent** | `src/components/PhantomEvent.jsx` | Random phantom mob encounter overlay | 150 |
| **ProfileCard** | `src/components/profile/ProfileCard.jsx` | Profile display with level colors and parent verification | 142 |
| **ParentalVerificationModal** | `src/components/ui/ParentalVerificationModal.jsx` | Math-based parental gate | 125 |
| **ResetModal** | `src/components/modals/ResetModal.jsx` | Confirmation modal for game reset | 107 |
| **PixelHeart** | `src/components/ui/PixelHeart.jsx` | SVG pixel-art heart for health display | 93 |
| **AchievementToast** | `src/components/ui/AchievementToast.jsx` | Achievement notification popup | 82 |
| **SettingsDrawer** | `src/components/drawers/SettingsDrawer.jsx` | Settings: volume, profiles | 67 |
| **MobWithAura** | `src/components/ui/MobWithAura.jsx` | Mob image with CSS aura overlay | 57 |
| **mobDisplayUtils** | `src/utils/mobDisplayUtils.js` | Random aura generation | 44 |
| **assets** | `src/constants/assets.js` | Asset path constants | 36 |
| **SafeImage** | `src/components/ui/SafeImage.jsx` | Image with fallback on error | 19 |
| **BugReportModal** | `src/components/modals/BugReportModal.jsx` | Bug report link modal | 19 |
| **main** | `src/main.jsx` | React entry point | 9 |
| **electron/main** | `electron/main.cjs` | Electron shell (desktop build) | 54 |

### Dependency / Call Graph

```
main.jsx
└── App.jsx (1,492 lines — GOD COMPONENT)
    │
    ├── IMPORTS: gameUtils, soundManager, achievementUtils, mobDisplayUtils
    │            gameData (SKILLS_CONFIG, THEMES, HOMOPHONES), achievements
    │
    ├── GlobalStyles ───── (pure CSS, no logic)
    ├── SkillCard ─────── gameUtils(calculateXPToLevel), soundManager(playClick, getSfxVolume)
    │   ├── MobWithAura ── SafeImage
    │   ├── PixelHeart
    │   └── ParentalVerificationModal
    ├── CosmeticsDrawer ── achievements(ACHIEVEMENTS), SafeImage
    ├── SettingsDrawer ─── ProfileCard
    │                      ├── SafeImage
    │                      └── ParentalVerificationModal
    ├── MenuDrawer ─────── achievementUtils(*), gameUtils(calculateXPToLevel), SafeImage
    ├── ResetModal
    ├── BugReportModal
    ├── AchievementToast ─ achievements(ACHIEVEMENTS)
    └── PhantomEvent ───── soundManager(playSuccessfulHit)
```

### Where State Lives

| State | Location | Persistence |
|-------|----------|-------------|
| All game state (skills, XP, levels, mobs, health, difficulty) | `App.jsx` useState | localStorage per profile |
| Player stats (kills, logins, achievements) | `App.jsx` useState | localStorage per profile |
| Profile names, parent status | `App.jsx` useState | localStorage |
| Theme selection | `App.jsx` useState | localStorage per profile |
| Cosmetics (border, effects) | `App.jsx` useState | localStorage per profile |
| UI state (drawers, modals, carousel index) | `App.jsx` useState | Not persisted |
| BGM volume | `App.jsx` useState + soundManager | localStorage |
| SFX volume | `App.jsx` useState + soundManager module var | localStorage |
| Voice recognition | `App.jsx` useRef | Not persisted |
| Battle/challenge state | `App.jsx` useState | Not persisted |

### I/O Boundaries

| I/O Type | Location | Details |
|----------|----------|---------|
| **Storage** | `App.jsx` (localStorage) | Read/write on profile switch, skill update, settings change. Keys: `heroSkills_v23_p{id}`, `heroStats_v3_p{id}`, `heroTheme_v2_p{id}`, etc. |
| **Audio** | `soundManager.js` | Web Audio API via `new Audio()`. BGM with crossfade. SFX for UI, mobs, achievements. Files in `public/assets/sounds/` |
| **Speech Recognition** | `App.jsx` | Web Speech API (`webkitSpeechRecognition`). Used for reading skill voice input. |
| **Network** | None | Fully offline game. No API calls. |
| **Electron IPC** | `electron/main.cjs` | Only for desktop window management. No data exchange. |

---

## 2. Debt Items

### DEBT-001: God Component — App.jsx

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` (1,492 lines, ~218 decision points) |
| **Smell** | God Object / Large Class. Single component holds ALL game logic: battle system, XP calculations, voice recognition, carousel navigation, profile management, difficulty control, achievement tracking, challenge generation, fullscreen toggle. |
| **Impact** | HIGH — Impossible to test individual features. Any change risks regressions across unrelated systems. New developer onboarding takes significantly longer. |
| **Risk** | HIGH — Every feature change touches this file. Merge conflicts guaranteed with parallel work. |
| **Effort** | L (3-5 days) — Extract into custom hooks: `useBattle`, `useProfile`, `useVoiceRecognition`, `useCarousel`, `useAchievements`, `useChallenges` |
| **Priority** | P1 |
| **Status** | Open |

### DEBT-002: GlobalStyles Monolith

| Field | Value |
|-------|-------|
| **Location** | `src/components/ui/GlobalStyles.jsx` (1,302 lines) |
| **Smell** | CSS-in-JSX monolith. All styles in one `<style>` tag inside a React component. Mixes animations, layouts, theme styles, component styles. |
| **Impact** | MEDIUM — Hard to find styles. No scoping. Dead CSS accumulates. Can't tree-shake. |
| **Risk** | MEDIUM — Style conflicts possible. No way to know which styles are actually used. |
| **Effort** | M (2-3 days) — Extract to CSS modules or Tailwind utilities per component. |
| **Priority** | P2 |
| **Status** | Open |

### DEBT-003: SkillCard Does Too Much

| Field | Value |
|-------|-------|
| **Location** | `src/components/skills/SkillCard.jsx` (778 lines, ~119 decision points) |
| **Smell** | God Component (smaller). Handles 6 different skill types (patterns, math, reading, writing, memory, axolotl) with complex branching. Audio playback logic mixed with UI. |
| **Impact** | HIGH — Adding new skill type requires understanding all existing ones. Bug in one skill's logic can break others. |
| **Risk** | HIGH — Most complex rendering path in app. |
| **Effort** | M (2-3 days) — Extract per-skill components: `PatternGame`, `MathGame`, `ReadingGame`, `WritingGame`, `MemoryGame`, `AxolotlGame` |
| **Priority** | P1 |
| **Status** | Open |

### DEBT-004: Dead Code

| Field | Value |
|-------|-------|
| **Location** | Multiple files |
| **Items** | `getItemsForLength()` (gameUtils.js:321), `playMobSay()` (soundManager.js:276), `recordLoginDate()` (achievementUtils.js:189), `generateMobWithAura()` (mobDisplayUtils.js:32), `getAchievementsByCategory()` (achievements.js:316), `formatDisplayName()` (gameData.jsx:279), entire `MenuDrawer_old.jsx` file |
| **Impact** | LOW — Increases bundle size, confuses developers. |
| **Risk** | LOW — No runtime impact. |
| **Effort** | XS (30 min) |
| **Priority** | P0 (quick win) |
| **Status** | **In Progress** |

### DEBT-005: No Tests

| Field | Value |
|-------|-------|
| **Location** | Entire codebase |
| **Smell** | Zero test files. No testing framework configured. No unit tests, no integration tests, no E2E tests. |
| **Impact** | CRITICAL — No regression safety net. Every refactoring is blind. Can't verify game logic correctness. |
| **Risk** | CRITICAL — Refactoring without tests = introducing bugs. |
| **Effort** | L (5+ days for meaningful coverage) — Add Vitest + React Testing Library. Priority: game logic utils first, then component tests. |
| **Priority** | P0 |
| **Status** | Open |

### DEBT-006: No CI/CD Pipeline

| Field | Value |
|-------|-------|
| **Location** | `.github/workflows/` (only `build-exe.yml` for Electron) |
| **Smell** | No lint check, no test run, no build verification on push/PR. Only workflow builds Windows .exe. |
| **Impact** | HIGH — Broken code can reach main undetected. No automated quality gates. |
| **Risk** | HIGH — Manual-only verification. |
| **Effort** | S (1 day) — Add CI workflow: lint, test, build, containerize. |
| **Priority** | P0 |
| **Status** | **In Progress** |

### DEBT-007: macOS Metadata Files in Repo

| Field | Value |
|-------|-------|
| **Location** | 112 `._*` files throughout repo |
| **Smell** | macOS resource fork files committed. Cause ESLint parse errors. Noise in file listings. |
| **Impact** | LOW — Only affects tooling, not runtime. |
| **Risk** | LOW |
| **Effort** | XS (10 min) — Delete all `._*` files, add to `.gitignore`. |
| **Priority** | P0 (quick win) |
| **Status** | **In Progress** |

### DEBT-008: Duplicated Code

| Field | Value |
|-------|-------|
| **Location** | `CosmeticsDrawer.jsx` (lines 152-176 duplicated at 259-283), `SkillCard.jsx` (lines 167-175 duplicated at 175-184), `MenuDrawer.jsx` / `MenuDrawer_old.jsx` (massive overlap) |
| **Smell** | Copy-paste duplication. jscpd found 6 clones, 3.37% token duplication. |
| **Impact** | MEDIUM — Bug fixes must be applied in multiple places. |
| **Risk** | MEDIUM — Easy to fix one copy and forget the other. |
| **Effort** | S (1 day) — Extract shared components, remove old file. |
| **Priority** | P2 |
| **Status** | Open |

### DEBT-009: Hardcoded localStorage Keys

| Field | Value |
|-------|-------|
| **Location** | `src/App.jsx` (lines 55, 172+, 185+, 202+, throughout) |
| **Smell** | Storage keys like `heroSkills_v23_p${profileId}` scattered across App.jsx. Version bumps require searching entire file. No migration strategy. |
| **Impact** | MEDIUM — Players lose save data on key changes. No backward compatibility. |
| **Risk** | MEDIUM — Key change = silent data loss for users. |
| **Effort** | S (1 day) — Extract storage layer with key constants and migration support. |
| **Priority** | P2 |
| **Status** | Open |

### DEBT-010: No Error Boundaries

| Field | Value |
|-------|-------|
| **Location** | Entire React tree |
| **Smell** | No React Error Boundaries. Any render error crashes entire app with white screen. |
| **Impact** | HIGH — Single bug in any component takes down entire game. |
| **Risk** | MEDIUM — Especially risky with speech recognition and audio APIs that can throw. |
| **Effort** | S (half day) — Add ErrorBoundary wrapper with fallback UI. |
| **Priority** | P1 |
| **Status** | Open |

### DEBT-011: Sound Manager Singleton Pattern

| Field | Value |
|-------|-------|
| **Location** | `src/utils/soundManager.js` |
| **Smell** | Module-level mutable state (`sfxVolume`, `bgmManager`). Implicit singleton. Not testable. BGM crossfade logic is complex (287 lines) with manual Audio object management. |
| **Impact** | MEDIUM — Can't mock for tests. Volume state can desync. |
| **Risk** | LOW — Works at runtime, problematic for testing. |
| **Effort** | M (1-2 days) — Refactor to class or React context with proper lifecycle. |
| **Priority** | P3 |
| **Status** | Open |

### DEBT-012: No Containerization

| Field | Value |
|-------|-------|
| **Location** | Project root |
| **Smell** | No Dockerfile. No way to build/run reproducibly. Environment-dependent. |
| **Impact** | MEDIUM — "Works on my machine" risk. No deployment strategy for web version. |
| **Risk** | MEDIUM |
| **Effort** | S (half day) |
| **Priority** | P0 |
| **Status** | **In Progress** |

### DEBT-013: No Monitoring / Metrics

| Field | Value |
|-------|-------|
| **Location** | Entire project |
| **Smell** | No runtime metrics. No error tracking. No performance monitoring. No way to know if game crashes for users. |
| **Impact** | MEDIUM — Blind to production issues. |
| **Risk** | MEDIUM |
| **Effort** | M (2 days) — Add Prometheus metrics endpoint + Grafana dashboard for build/deploy metrics. |
| **Priority** | P2 |
| **Status** | Open |

---

## 3. Baseline Metrics

> Captured 2026-11-18, before any refactoring.

| Metric | Value | Tool |
|--------|-------|------|
| Total source files | 27 (.js/.jsx/.cjs) | `find + wc` |
| Total source lines | 7,069 | `wc -l` |
| Largest file | `App.jsx` — 1,492 lines | `wc -l` |
| Test coverage | **0%** (no tests exist) | N/A |
| ESLint errors | 0 real errors (28 from macOS `._` files) | `eslint 9.39.1` |
| Duplication | 6 clones, 3.37% token duplication | `jscpd 5.4.3` |
| Decision points (App.jsx) | ~218 | `grep -c` (if/else/case/ternary/&&/\|\|) |
| Decision points (SkillCard) | ~119 | `grep -c` |
| Decision points (gameUtils) | ~39 | `grep -c` |
| Dead functions | 7 | Manual analysis (see CODEBASE_MAP.md) |
| Dead files | 1 (`MenuDrawer_old.jsx`) | Manual analysis |
| macOS metadata files | 112 `._*` files | `find -name '._*'` |
| Dependencies (prod) | 3 (react, react-dom, lucide-react) | `package.json` |
| Dependencies (dev) | 12 | `package.json` |
| Bundle size (built) | Not measured (no production build yet) | — |

### How to Reproduce

```bash
# Line counts
find src -name '*.jsx' -o -name '*.js' | xargs wc -l

# ESLint
npx eslint .

# Duplication
npx jscpd src/ --min-lines 5 --min-tokens 50

# Decision point estimate (cyclomatic complexity proxy)
grep -c 'if \|if(\|else \|case \|for \|while \|&&\||||\|? ' src/App.jsx

# Dead code: see CODEBASE_MAP.md function call map
```

---

## 4. Risk Matrix

### Impact × Likelihood

```
              │ Low Likelihood │ Med Likelihood │ High Likelihood │
──────────────┼────────────────┼────────────────┼─────────────────┤
High Impact   │ DEBT-010       │ DEBT-002       │ DEBT-001        │
              │ (Error bounds) │ (GlobalStyles) │ DEBT-003        │
              │                │                │ DEBT-005        │
              │                │                │ DEBT-006        │
──────────────┼────────────────┼────────────────┼─────────────────┤
Med Impact    │ DEBT-011       │ DEBT-008       │ DEBT-009        │
              │ (Sound mgr)    │ (Duplication)  │ DEBT-012        │
              │                │ DEBT-013       │ DEBT-013        │
──────────────┼────────────────┼────────────────┼─────────────────┤
Low Impact    │                │                │ DEBT-004        │
              │                │                │ DEBT-007        │
──────────────┴────────────────┴────────────────┴─────────────────┘
```

### Phased Attack Plan

#### Phase 0 — Quick Wins (Week 1) ✅ IN PROGRESS
1. **DEBT-007**: Remove macOS `._` files + `.gitignore`
2. **DEBT-004**: Delete dead code (7 functions + 1 file)
3. **DEBT-006**: CI/CD pipeline (lint, build, containerize)
4. **DEBT-012**: Dockerfile for web deployment

**Why first:** Zero risk, immediate cleanliness. CI/CD enables safe iteration.

#### Phase 1 — Safety Net (Week 2)
5. **DEBT-005**: Add Vitest + test game logic utils (`gameUtils.js`, `achievementUtils.js`)
6. **DEBT-010**: Error boundaries

**Why second:** Tests required before any refactoring. Error boundaries prevent white-screen crashes.

#### Phase 2 — Break the God Components (Weeks 3-4)
7. **DEBT-001**: Extract App.jsx into custom hooks (`useBattle`, `useProfile`, `useVoiceRecognition`, `useCarousel`, `useAchievements`)
8. **DEBT-003**: Split SkillCard into per-skill components
9. **DEBT-009**: Extract storage layer

**Why third:** Biggest impact on maintainability. Tests from Phase 1 protect against regressions.

#### Phase 3 — Polish (Week 5+)
10. **DEBT-002**: Break GlobalStyles into CSS modules
11. **DEBT-008**: Remove duplicated code
12. **DEBT-011**: Refactor sound manager
13. **DEBT-013**: Add Prometheus/Grafana metrics

**Why last:** Lower risk items. Cosmetic and observability improvements.

#### Phase 4 — Performance (Week 6+)
14. Identify hot paths via profiling
15. Consider WebAssembly/Rust for computation-heavy functions if needed
16. Bundle optimization and lazy loading
