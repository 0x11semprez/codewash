# Technical debt register

> Living document. Last updated: 2026-11-18

---

## 1. Codebase map

### Module overview

| Module | Path | Lines |
|--------|------|-------|
| App (god component) | `src/App.jsx` | 1,492 |
| GlobalStyles | `src/components/ui/GlobalStyles.jsx` | 1,302 |
| SkillCard | `src/components/skills/SkillCard.jsx` | 778 |
| gameData | `src/constants/gameData.jsx` | 416 |
| gameUtils | `src/utils/gameUtils.js` | 363 |
| CosmeticsDrawer | `src/components/drawers/CosmeticsDrawer.jsx` | 322 |
| achievements | `src/constants/achievements.js` | 318 |
| soundManager | `src/utils/soundManager.js` | 287 |
| MenuDrawer | `src/components/drawers/MenuDrawer.jsx` | 262 |
| MenuDrawer_old | `src/components/drawers/MenuDrawer_old.jsx` | 231 |
| achievementUtils | `src/utils/achievementUtils.js` | 217 |
| PhantomEvent | `src/components/PhantomEvent.jsx` | 150 |
| ProfileCard | `src/components/profile/ProfileCard.jsx` | 142 |
| ParentalVerificationModal | `src/components/ui/ParentalVerificationModal.jsx` | 125 |
| ResetModal | `src/components/modals/ResetModal.jsx` | 107 |
| PixelHeart | `src/components/ui/PixelHeart.jsx` | 93 |
| AchievementToast | `src/components/ui/AchievementToast.jsx` | 82 |
| SettingsDrawer | `src/components/drawers/SettingsDrawer.jsx` | 67 |
| MobWithAura | `src/components/ui/MobWithAura.jsx` | 57 |
| mobDisplayUtils | `src/utils/mobDisplayUtils.js` | 44 |
| assets (dead) | `src/constants/assets.js` | 36 |
| SafeImage | `src/components/ui/SafeImage.jsx` | 19 |
| BugReportModal | `src/components/modals/BugReportModal.jsx` | 19 |
| main | `src/main.jsx` | 9 |
| electron/main | `electron/main.cjs` | 54 |

**Total:** 6,938 source lines across 25 files (.js/.jsx/.cjs)

### Call graph

```
main.jsx
└── App.jsx (GOD COMPONENT)
    ├── GlobalStyles (pure CSS)
    ├── SkillCard ── gameUtils, soundManager, MobWithAura, SafeImage, ParentalVerificationModal
    ├── CosmeticsDrawer ── achievements, SafeImage
    ├── SettingsDrawer ── ProfileCard ── SafeImage, ParentalVerificationModal
    ├── MenuDrawer ── achievementUtils, gameUtils, SafeImage
    ├── ResetModal
    ├── BugReportModal
    ├── AchievementToast ── achievements
    └── PhantomEvent ── soundManager
```

### State (all in App.jsx)

| What | Persisted |
|------|-----------|
| Skills, XP, levels, mobs, health, difficulty | localStorage per profile |
| Player stats (kills, logins, achievements) | localStorage per profile |
| Profile names, parent status | localStorage |
| Theme, cosmetics | localStorage per profile |
| UI state (drawers, modals, carousel) | No |
| BGM/SFX volume | localStorage |
| Voice recognition, battle state | No |

### I/O boundaries

- **Storage:** localStorage only. Keys scattered in App.jsx (`heroSkills_v23_p{id}`, etc.)
- **Audio:** `new Audio()` per play. BGM shuffle in soundManager.js.
- **Speech:** Web Speech API (`webkitSpeechRecognition`). Reading skill only.
- **Network:** None. Fully offline.
- **Electron:** Window management only.

---

## 2. Debt items

### DEBT-001: God component, App.jsx [P1] [Open]
1,492 lines, ~218 decision points. Holds all game logic: battles, XP, voice, carousel, profiles, difficulty, achievements, challenges, fullscreen.
Fix: extract hooks (`useBattle`, `useProfile`, `useVoiceRecognition`, `useCarousel`, `useAchievements`). Effort: L

### DEBT-002: GlobalStyles monolith [P2] [Open]
1,302 lines of CSS in one `<style>` tag. Mixes animations, layouts, themes, auras. No scoping, no tree-shaking.
Fix: CSS modules or Tailwind utilities per component. Effort: M

### DEBT-003: SkillCard does too much [P1] [Open]
778 lines, ~119 decision points. 6 skill types (patterns, math, reading, writing, memory, cleaning) in one component with complex branching.
Fix: extract per-skill components. Effort: M

### DEBT-004: Dead code [P0] [In Progress]
- `getItemsForLength()` — gameUtils.js:321
- `playMobSay()` — soundManager.js:276
- `recordLoginDate()` — achievementUtils.js:189
- `generateMobWithAura()` — mobDisplayUtils.js:32
- `getAchievementsByCategory()` — achievements.js:316
- `formatDisplayName()` — gameData.jsx:279
- `WRITING_ITEMS_BY_LENGTH` — gameData.jsx:397 (exported, never imported)
- `assets.js` — entire file (placeholder paths, nothing references it)
- `MenuDrawer_old.jsx` — entire file

Effort: XS

### DEBT-005: No tests [P0] [Open]
Zero test files. No testing framework. Game logic in `gameUtils.js` is pure functions, trivially testable.
Fix: Vitest + React Testing Library. Utils first. Effort: L

### DEBT-006: No CI/CD pipeline [P0] [In Progress]
Only workflow is `build-exe.yml` for Electron. No lint, test, or build verification on push/PR.
Fix: CI workflow: lint, test, build. Effort: S

### DEBT-007: macOS metadata files [P0] [In Progress]
112 `._*` files in repo. Cause ESLint parse errors.
Fix: delete + `.gitignore`. Effort: XS

### DEBT-008: Duplicated code [P2] [Open]
- `CosmeticsDrawer.jsx` — BORDER_EFFECTS render (108-224) and ACHIEVEMENT_EFFECTS render (227-314) are near-identical blocks
- `MenuDrawer.jsx` / `MenuDrawer_old.jsx` — massive overlap

Fix: extract shared `BorderEffectCard` component. Delete old file. Effort: S

### DEBT-009: Hardcoded localStorage keys [P2] [Open]
Keys like `heroSkills_v23_p${profileId}` scattered in App.jsx. No migration strategy. Key change = silent data loss.
Fix: storage layer with key constants + migration. Effort: S

### DEBT-010: No error boundaries [P1] [Open]
Any render error crashes entire app to white screen. Risky with speech recognition and audio APIs.
Fix: add ErrorBoundary with fallback UI. Effort: S

### DEBT-011: Sound manager issues [P3] [Open]
- Module-level mutable state (`sfxVolume`, `bgmManager`). Not testable.
- `new Audio()` created per play. No pooling. Dozens of objects during rapid battles.

Fix: refactor to class/context. Add audio pool. Effort: M

### DEBT-012: No containerization [P0] [In Progress]
No Dockerfile. No reproducible build.
Fix: Dockerfile + nginx. Effort: S

### DEBT-013: No monitoring [P2] [Open]
No error tracking, no metrics, no crash reporting.
Fix: basic error tracking. Effort: M

### DEBT-014: `perfectMemoryGames` never incremented [P1] [Open]
`achievements.js:243` checks `stats.perfectMemoryGames >= 1` for "Perfectionist" achievement. No code increments this counter. Achievement is permanently unreachable.
Fix: track zero-mismatch memory wins in `handleCardClick` chain. Effort: XS

### DEBT-015: `battlesThisSession` never resets [P2] [Open]
`speed_demon` achievement checks `battlesThisSession >= 10` per session. Counter persists to localStorage. Once lifetime battles exceed 10, achievement unlocks permanently on next load.
Fix: reset to 0 in `getDefaultStats()` load path or on mount. Effort: XS

### DEBT-016: Stale state in `handleSuccessHit` [P2] [Open]
`App.jsx:448` reads `skills[battlingSkillId]` outside the `setSkills` updater. During rapid answers, `skills` can be stale. Same at line 532.
Fix: move all reads inside `setSkills(prev => ...)` callback. Effort: S

### DEBT-017: `setTimeout` for achievement checks [P2] [Open]
Lines 490, 652, 836, 854 use `setTimeout(() => checkAchievements(...), 100)` to defer after `setStats`. Fragile timing workaround.
Fix: `useEffect` watching `stats` changes. Effort: S

### DEBT-018: Unsafe JSON.parse in handleReset [P3] [Open]
`App.jsx:971-972` does `JSON.parse()` without try-catch. Other parse calls are wrapped.
Fix: add try-catch or use shared parse helper. Effort: XS

### DEBT-019: External resources in component render [P3] [Open]
- `GlobalStyles.jsx:5` — Google Fonts `@import` inside `<style>` tag (re-fetches on remount)
- `ProfileCard.jsx:69`, `SkillCard.jsx:440` — `transparenttextures.com` pattern URLs

Fix: move font import to `index.html` `<head>`. Inline or self-host texture. Effort: XS

---

## 3. Baseline metrics

| Metric | Value |
|--------|-------|
| Source files | 25 (.js/.jsx/.cjs) |
| Source lines | 6,938 |
| Largest file | App.jsx — 1,492 lines |
| Test coverage | 0% |
| ESLint errors | 0 real (28 from `._` files) |
| Duplication | 6 clones, 3.37% |
| Dead functions | 7 |
| Dead files | 2 (MenuDrawer_old.jsx, assets.js) |
| macOS metadata | 112 `._*` files |
| Prod deps | 3 (react, react-dom, lucide-react) |
| Dev deps | 12 |

---

## 4. Risk matrix

```
              │ Low Likelihood │ Med Likelihood  │ High Likelihood │
──────────────┼────────────────┼─────────────────┼─────────────────┤
High Impact   │ DEBT-010       │ DEBT-002        │ DEBT-001        │
              │                │                 │ DEBT-003        │
              │                │                 │ DEBT-005        │
              │                │                 │ DEBT-006        │
──────────────┼────────────────┼─────────────────┼─────────────────┤
Med Impact    │ DEBT-011       │ DEBT-008        │ DEBT-009        │
              │                │ DEBT-013        │ DEBT-012        │
              │                │ DEBT-016, 017   │ DEBT-014, 015   │
──────────────┼────────────────┼─────────────────┼─────────────────┤
Low Impact    │ DEBT-018, 019  │                 │ DEBT-004        │
              │                │                 │ DEBT-007        │
──────────────┴────────────────┴─────────────────┴─────────────────┘
```

---

## 5. Phased plan

### Phase 0: quick wins (week 1) ✅ IN PROGRESS
1. **DEBT-007**: Remove `._` files + `.gitignore`
2. **DEBT-004**: Delete dead code (7 functions + 2 files)
3. **DEBT-006**: CI pipeline
4. **DEBT-012**: Dockerfile
5. **DEBT-014**: Fix `perfectMemoryGames` counter
6. **DEBT-015**: Fix `battlesThisSession` reset
7. **DEBT-018**: Add try-catch to handleReset parse
8. **DEBT-019**: Move font import to `<head>`

### Phase 1: safety net (week 2)
9. **DEBT-005**: Vitest + test game logic utils
10. **DEBT-010**: Error boundaries

### Phase 2: break god components (weeks 3-4)
11. **DEBT-001**: Extract App.jsx into hooks
12. **DEBT-003**: Split SkillCard per skill type
13. **DEBT-009**: Extract storage layer
14. **DEBT-016**: Fix stale state reads
15. **DEBT-017**: Replace setTimeout achievement checks

### Phase 3: polish (week 5+)
16. **DEBT-002**: Break GlobalStyles into modules
17. **DEBT-008**: Remove duplication
18. **DEBT-011**: Refactor sound manager + audio pooling
19. **DEBT-013**: Add error tracking
