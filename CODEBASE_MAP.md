# CodeWashGame - Codebase Map

## Summary

| Metric | Value |
|--------|-------|
| Total files (excluding .git, node_modules, macOS `._` files) | ~85 (197 raw, ~112 are macOS `._` metadata) |
| Source files (.js/.jsx/.cjs) | 27 |
| Total source lines | 7,069 |
| Config files | 6 (vite, tailwind, postcss, eslint, package.json, build-exe.yml) |
| Asset files (images, sounds) | ~50+ |

## File Line Counts

| File | Lines |
|------|-------|
| `src/App.jsx` | 1,492 |
| `src/components/ui/GlobalStyles.jsx` | 1,302 |
| `src/components/skills/SkillCard.jsx` | 778 |
| `src/constants/gameData.jsx` | 416 |
| `src/utils/gameUtils.js` | 363 |
| `src/constants/achievements.js` | 318 |
| `src/components/drawers/CosmeticsDrawer.jsx` | 322 |
| `src/utils/soundManager.js` | 287 |
| `src/components/drawers/MenuDrawer.jsx` | 262 |
| `src/components/drawers/MenuDrawer_old.jsx` | 231 |
| `src/utils/achievementUtils.js` | 217 |
| `src/components/PhantomEvent.jsx` | 150 |
| `src/components/profile/ProfileCard.jsx` | 142 |
| `src/components/ui/ParentalVerificationModal.jsx` | 125 |
| `src/components/modals/ResetModal.jsx` | 107 |
| `src/components/ui/PixelHeart.jsx` | 93 |
| `src/components/ui/AchievementToast.jsx` | 82 |
| `src/components/drawers/SettingsDrawer.jsx` | 67 |
| `src/components/ui/MobWithAura.jsx` | 57 |
| `electron/main.cjs` | 54 |
| `src/utils/mobDisplayUtils.js` | 44 |
| `src/constants/assets.js` | 36 |
| `tailwind.config.js` | 35 |
| `eslint.config.js` | 29 |
| `src/components/ui/SafeImage.jsx` | 19 |
| `src/components/modals/BugReportModal.jsx` | 19 |
| `src/main.jsx` | 9 |
| `vite.config.js` | 8 |
| `postcss.config.js` | 5 |

---

## Functions & Call Map

### `src/utils/gameUtils.js` (363 lines)

| Line | Function | Called From |
|------|----------|------------|
| 3 | `getRandomMob(exclude)` | `App.jsx:65,73,76-78,123,127,130,133,664,671,675,679,744,756` / `gameUtils.js:69` (self) |
| 9 | `getRandomFriendlyMob()` | `App.jsx:72,119,661` / `gameUtils.js:43` (self) |
| 14 | `getRandomMiniboss()` | `App.jsx:74,152,690` / `gameUtils.js:56` (self) |
| 19 | `getRandomBoss()` | `App.jsx:75,155,696` / `gameUtils.js:51` (self) |
| 26 | `getEncounterType(level)` | `App.jsx:450,542,621,689,695,902,1183` / `gameUtils.js:47` (self) |
| 33 | `getMobForSkill(skillConfig, userSkill)` | `App.jsx:1417` |
| 93 | `getDifficultyMultiplier(difficulty)` | `gameUtils.js:100,106,131,152,163` (internal only) |
| 99 | `calculateDamage(playerLevel, difficulty)` | `App.jsx:539` |
| 105 | `calculateMobHealth(difficulty)` | `App.jsx:68,69,107,108,753,810` |
| 112 | `getExpectedDifficulty(playerLevel)` | `gameUtils.js:125,156` (internal only) |
| 118 | `calculateXPReward(difficulty, playerLevel)` | `App.jsx:597` |
| 149 | `calculateXPToLevel(difficulty, playerLevel)` | `App.jsx:711` / `SkillCard.jsx:612` / `MenuDrawer.jsx:61` |
| 171 | `getReadingWord(difficulty)` | `App.jsx:394` |
| 184 | `generateMathProblem(difficulty)` | `App.jsx:386` |
| 293 | `getWordForDifficulty(difficulty)` | `App.jsx:399` |
| 321 | `getItemsForLength(targetLength)` | **NOT CALLED** (dead code) |

### `src/utils/soundManager.js` (287 lines)

| Line | Function | Called From |
|------|----------|------------|
| 159 | `getBGMManager()` | `App.jsx:271` |
| 169 | `setSfxVolume(vol)` | `App.jsx:341` |
| 173 | `getSfxVolume()` | `SkillCard.jsx:103,229,339,375,410,418` |
| 179 | `playUISound(soundName)` | Internal: `playClick`, `playDeath`, `playFail`, `playLevelUp`, `playNotification`, `playAchievement` |
| 191 | `playActionCardLeft()` | `App.jsx:1158,1172,1325` |
| 196 | `playActionCardRight()` | `App.jsx:1155,1170,1352` |
| 201 | `playClick()` | `App.jsx:380,911,922,927,1212,1219,1233,1252,1286,1297,1304` / `SkillCard.jsx:106,110,403` |
| 206 | `playDeath()` | `App.jsx:480` |
| 211 | `playFail()` | `App.jsx:470,525` |
| 216 | `playLevelUp()` | `App.jsx:748,868` |
| 221 | `playNotification()` | `App.jsx:707,736,890` |
| 226 | `playSuccessfulHit()` | `App.jsx:566` / `PhantomEvent.jsx:79` |
| 232 | `playAchievement()` | `App.jsx:433,440` |
| 239 | `getMobFolder(mobName)` | Internal: `playMobHurt`, `playMobDeath`, `playMobSay` |
| 248 | `playMobHurt(mobName)` | `App.jsx:562` |
| 262 | `playMobDeath(mobName)` | `App.jsx:560` |
| 276 | `playMobSay(mobName)` | **NOT CALLED** (dead code) |

### `src/utils/achievementUtils.js` (217 lines)

| Line | Function | Called From |
|------|----------|------------|
| 11 | `getDefaultStats()` | `App.jsx:194,199` |
| 35 | `isAchievementUnlocked(id, stats, skills)` | `App.jsx:326` / `achievementUtils.js:134,135` (self) / `MenuDrawer.jsx:34,144` |
| 56 | `getCurrentTier(id, stats, skills)` | `achievementUtils.js:83,105,160,161,209` (self) / `MenuDrawer.jsx:155` |
| 79 | `getNextTier(id, stats, skills)` | `achievementUtils.js:106` (self) / `MenuDrawer.jsx:156` |
| 100 | `getTierProgress(id, stats, skills)` | `MenuDrawer.jsx:158` |
| 129 | `getNewlyUnlockedAchievements(old, new, oldSkills, newSkills)` | `App.jsx:424` |
| 153 | `getNewTierAchievements(old, new, oldSkills, newSkills)` | `App.jsx:427` |
| 177 | `addUniqueToArray(arr, value)` | `App.jsx:631,638,645` |
| 189 | `recordLoginDate(loginDates)` | **NOT CALLED** (dead code) |
| 204 | `getAchievementDisplayName(id, stats, skills)` | `MenuDrawer.jsx:159` |

### `src/utils/mobDisplayUtils.js` (44 lines)

| Line | Function | Called From |
|------|----------|------------|
| 22 | `getRandomAura()` | `App.jsx:80-85,137-161,665-697` / `mobDisplayUtils.js:33` (self) |
| 32 | `generateMobWithAura(mobName, mobSrc)` | **NOT CALLED** (dead code) |

### `src/constants/achievements.js` (318 lines)

| Line | Export | Called From |
|------|--------|------------|
| 69 | `ACHIEVEMENTS` (object) | `achievementUtils.js:36,57,80,101,132,156,157,205` / `MenuDrawer.jsx:33,36,142` / `AchievementToast.jsx:10` / `CosmeticsDrawer.jsx:231` |
| 313 | `getAllAchievements()` | `achievements.js:317` (self, in `getAchievementsByCategory`) |
| 316 | `getAchievementsByCategory(category)` | **NOT CALLED** (dead code) |

### `src/constants/gameData.jsx` (416 lines)

| Line | Export | Called From |
|------|--------|------------|
| 279 | `formatDisplayName(word)` | **NOT CALLED** (dead code) |
| 407 | `HOMOPHONES` (object) | `App.jsx:1063` / `SkillCard.jsx:270` |
| — | `SKILLS_CONFIG` (array) | `App.jsx:2-5` (imported as destructured) |
| — | `THEMES` (object) | `App.jsx:2-5` |
| — | Various data constants (MOBS, FRIENDLY_MOBS, etc.) | `gameUtils.js`, `App.jsx` |

### `src/constants/assets.js` (36 lines)

| Line | Export | Called From |
|------|--------|------------|
| 37 | `default` (assets object) | `gameData.jsx` (asset path references) |

---

## Components & Where Rendered

### `src/App.jsx` (1,492 lines) — Root Component

**Internal functions (defined inside App):**

| Line | Function | Purpose |
|------|----------|---------|
| 55 | `getStorageKey(profileId)` | Build localStorage key per profile |
| 56 | `loadSkills(profileId)` | Load skill state from localStorage |
| 172 | `loadTheme(profileId)` | Load theme preference |
| 185 | `loadStats(profileId)` | Load player stats |
| 202 | `getProfileStats(id, liveSkills)` | Compute profile summary stats |
| 351 | `handleFullscreenChange()` | Sync fullscreen state |
| 370 | `toggleFullscreen()` | Enter/exit fullscreen |
| 383 | `generateChallenge(type, diff)` | Create skill challenge (math/reading/writing/patterns/memory) |
| 444 | `handleSuccessHit(skillId, isWrong)` | Process correct/wrong answer, deal damage, track stats |
| 807 | `setSkillDifficulty(skillId, newDiff)` | Change difficulty for skill |
| 864 | `handlePhantomLevelAward(skillId)` | Award level from phantom event |
| 894 | `startBattle(id)` | Begin battle encounter |
| 916 | `endBattle()` | End battle, stop voice recognition |
| 925 | `handleSwitchProfile(newId)` | Switch active profile |
| 934 | `handleRenameProfile(id, newName)` | Rename profile |
| 937 | `handleParentVerified(profileId, verified)` | Set parent verification status |
| 964 | `handleReset()` | Reset all game data |
| 985 | `stopVoiceRecognition()` | Cleanup speech recognition |
| 999 | `startVoiceListener(targetId)` | Start speech-to-text for skill |
| 1083 | `toggleMicListener(targetId)` | Toggle microphone on/off |
| 1129 | `getVisibleItems()` | Get carousel visible skill cards |
| 1144 | `handleDragStart(clientX)` | Card carousel drag start |
| 1149 | `handleDragMove(clientX)` | Card carousel drag move |
| 1163 | `handleDragEnd()` | Card carousel drag end |
| 1166 | `handleCardClick(offset)` | Click card to navigate carousel |
| 1177 | `getAuraForSkill(skillConfig, userSkill)` | Get aura for skill mob |
| 1390 | `getVerticalOffset(offset)` | Carousel card positioning |

**Renders these children:**

| Component | Line |
|-----------|------|
| `<GlobalStyles />` | 1206 |
| `<SafeImage />` | 1320 |
| `<PixelHeart />` | (via SkillCard) |
| `<CosmeticsDrawer />` | 1236 |
| `<SettingsDrawer />` | 1255 |
| `<ResetModal />` | 1271 |
| `<BugReportModal />` | 1272 |
| `<MenuDrawer />` | 1300 |
| `<SkillCard />` | 1415 |
| `<AchievementToast />` | 1438 |
| `<PhantomEvent />` | 1470 |

### `src/components/skills/SkillCard.jsx` (778 lines)

**Functions:**

| Line | Function | Scope |
|------|----------|-------|
| 33 | `clamp(value, min, max)` | Module-level helper |
| 36 | `lerp(start, end, t)` | Module-level helper |
| 40 | `getTempoDelays(completedRounds, currentDifficulty)` | Module-level helper |
| 198 | `getButtonStyle()` | Component-internal |
| 204 | `darkenColor(hex)` | Nested inside getButtonStyle |
| 227 | `playMismatch()` | Component-internal |
| 303 | `playNext()` | Nested in pattern sequence logic |
| 329 | `handleAxolotlClick(color)` | Component-internal |
| 399 | `handleCardClick(index)` | Component-internal (memory game) |

**Rendered by:** `App.jsx:1415`
**Renders:** `SafeImage`, `MobWithAura`, `ParentalVerificationModal`, `PixelHeart`

### `src/components/drawers/MenuDrawer.jsx` (262 lines)

**Rendered by:** `App.jsx:1300`
**Imports:** `ACHIEVEMENTS`, `isAchievementUnlocked`, `getCurrentTier`, `getNextTier`, `getTierProgress`, `getAchievementDisplayName`, `calculateXPToLevel`, `SKILLS_CONFIG`, `SafeImage`

### `src/components/drawers/CosmeticsDrawer.jsx` (322 lines)

**Functions:**

| Line | Function | Scope |
|------|----------|-------|
| 42 | `isBorderUnlocked(badge)` | Component-internal |
| 49 | `isAchievementEffectUnlocked(achievementId)` | Component-internal |

**Rendered by:** `App.jsx:1236`
**Imports:** `ACHIEVEMENTS`, `SafeImage`

### `src/components/drawers/SettingsDrawer.jsx` (67 lines)

**Rendered by:** `App.jsx:1255`
**Renders:** `ProfileCard`

### `src/components/profile/ProfileCard.jsx` (142 lines)

**Functions:**

| Line | Function | Scope |
|------|----------|-------|
| 22 | `getLevelColors(level)` | Component-internal |
| 30 | `handleParentCheckboxChange(e)` | Component-internal |
| 38 | `handleParentalVerified()` | Component-internal |
| 47 | `getProfileCardClasses()` | Component-internal |
| 56 | `getProfileCardStyles()` | Component-internal |

**Rendered by:** `SettingsDrawer.jsx:23`
**Renders:** `SafeImage`, `ParentalVerificationModal`

### `src/components/ui/ParentalVerificationModal.jsx` (125 lines)

**Functions:**

| Line | Function | Scope |
|------|----------|-------|
| 14 | `handleSubmit(e)` | Component-internal |
| 26 | `handleClose()` | Component-internal |
| 32 | `handleInputChange(e)` | Component-internal |
| 41 | `handleSlotClick()` | Component-internal |
| 46 | `getInputIndexForDisplay(displayIndex)` | Component-internal |
| 57 | `getDisplayChar(displayIndex)` | Component-internal |
| 63 | `isSlotFilled(displayIndex)` | Component-internal |

**Rendered by:** `SkillCard.jsx:739,769` / `ProfileCard.jsx:133`

### `src/components/modals/ResetModal.jsx` (107 lines)

**Functions:**

| Line | Function | Scope |
|------|----------|-------|
| 12 | `handleClose()` | Component-internal |
| 18 | `handleInputChange(e)` | Component-internal |
| 26 | `handleSubmit(e)` | Component-internal |
| 37 | `handleSlotClick()` | Component-internal |

**Rendered by:** `App.jsx:1271`

### `src/components/PhantomEvent.jsx` (150 lines)

**Rendered by:** `App.jsx:1470`
**Imports:** `playSuccessfulHit`

### `src/components/ui/AchievementToast.jsx` (82 lines)

**Rendered by:** `App.jsx:1438`
**Imports:** `ACHIEVEMENTS`

### `src/components/ui/MobWithAura.jsx` (57 lines)

**Rendered by:** `SkillCard.jsx:446`
**Renders:** `SafeImage`

### `src/components/ui/GlobalStyles.jsx` (1,302 lines)

Pure CSS-in-JSX. No functions. **Rendered by:** `App.jsx:1206`

### `src/components/ui/PixelHeart.jsx` (93 lines)

**Functions:**

| Line | Function | Scope |
|------|----------|-------|
| 56 | `getColor(value)` | Component-internal |

**Rendered by:** `SkillCard.jsx` (via health display)

### `src/components/ui/SafeImage.jsx` (19 lines)

**Rendered by:** `App.jsx`, `MobWithAura`, `ProfileCard`, `SkillCard`, `MenuDrawer`, `CosmeticsDrawer`

### `src/components/modals/BugReportModal.jsx` (19 lines)

**Rendered by:** `App.jsx:1272`

### `src/components/drawers/MenuDrawer_old.jsx` (231 lines)

**NOT IMPORTED** — dead file (old version of MenuDrawer)

### `electron/main.cjs` (54 lines)

Electron main process. Creates BrowserWindow, loads Vite dev or built index.html.

### `src/main.jsx` (9 lines)

React entry point. Renders `<App />` into `#root`.

---

## Dead Code Summary

| Location | Item | Notes |
|----------|------|-------|
| `gameUtils.js:321` | `getItemsForLength()` | Exported but never imported |
| `soundManager.js:276` | `playMobSay()` | Exported but never called |
| `achievementUtils.js:189` | `recordLoginDate()` | Exported but never called |
| `mobDisplayUtils.js:32` | `generateMobWithAura()` | Exported but never called |
| `achievements.js:316` | `getAchievementsByCategory()` | Only called by itself via `getAllAchievements` which also isn't externally used |
| `gameData.jsx:279` | `formatDisplayName()` | Exported but never called |
| `drawers/MenuDrawer_old.jsx` | Entire file | Never imported |

---

## Component Tree

```
main.jsx
└── App.jsx
    ├── GlobalStyles
    ├── SafeImage (logo)
    ├── SkillCard (×N, carousel)
    │   ├── MobWithAura
    │   │   └── SafeImage
    │   ├── SafeImage (various)
    │   ├── PixelHeart
    │   └── ParentalVerificationModal
    ├── CosmeticsDrawer
    │   └── SafeImage
    ├── SettingsDrawer
    │   └── ProfileCard (×N)
    │       ├── SafeImage
    │       └── ParentalVerificationModal
    ├── MenuDrawer
    │   └── SafeImage
    ├── ResetModal
    ├── BugReportModal
    ├── AchievementToast
    └── PhantomEvent
```

## Data Flow

```
gameData.jsx ──────► App.jsx (SKILLS_CONFIG, THEMES, HOMOPHONES)
achievements.js ───► achievementUtils.js (ACHIEVEMENTS)
                  ├► MenuDrawer.jsx
                  ├► AchievementToast.jsx
                  └► CosmeticsDrawer.jsx
gameUtils.js ──────► App.jsx (mob/battle/XP/challenge generation)
                  ├► SkillCard.jsx (calculateXPToLevel)
                  └► MenuDrawer.jsx (calculateXPToLevel)
soundManager.js ───► App.jsx (all sound effects)
                  ├► SkillCard.jsx (playClick, getSfxVolume)
                  └► PhantomEvent.jsx (playSuccessfulHit)
mobDisplayUtils.js ► App.jsx (getRandomAura)
assets.js ─────────► gameData.jsx (asset paths)
```
