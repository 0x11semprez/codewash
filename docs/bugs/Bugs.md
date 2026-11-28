# Bug report

Bugs found in the code, with the proof, the cause, the fix and a before/after comparison. Same layout as the [performance report](../missions/performance.md). Screenshots are in [screens/](screens/).

## Summary

| Bug | Issue | Status | Outcome |
| --- | --- | --- | --- |
| Hardcoded localStorage keys | [#32](https://github.com/0x11semprez/codewash/issues/32) (DEBT-009) | Fixed (PR [#70](https://github.com/0x11semprez/codewash/pull/70)) | One file lists every key, and a migration moves old data |
| Corrupted save crashes the game | [#41](https://github.com/0x11semprez/codewash/issues/41) (DEBT-018) | Fixed (PR [#58](https://github.com/0x11semprez/codewash/pull/58), [#66](https://github.com/0x11semprez/codewash/pull/66)) | Not detailed here yet |
| `perfectMemoryGames` never incremented | [#37](https://github.com/0x11semprez/codewash/issues/37) (DEBT-014) | Fixed, PR pending | A memory game won without a mismatch is counted, and "Perfectionist" can be unlocked |
| Missing theme images | [#53](https://github.com/0x11semprez/codewash/issues/53) (DEBT-021) | Fixed | Themes mission (#21), not merged yet |
| Docker build fails on `npm ci` | [#54](https://github.com/0x11semprez/codewash/issues/54) (DEBT-022) | Open | Not started |
| Music only starts with the first battle | [#107](https://github.com/0x11semprez/codewash/issues/107) | Fixed, PR pending | The music starts on the first click, touch or key press anywhere |

Only the bugs with a section below are documented in detail. Every figure and screenshot says how it was produced.

---

## DEBT-009: hardcoded localStorage keys

### Problem

The game saves everything in the browser `localStorage`. The progress of each profile (levels, XP, theme, stats) is stored under a key such as `heroSkills_v23_p1` (`p1` is the profile number). The `v23` is a version number: when the format of the save changes, the key must change too.

Before the fix, key names were typed by hand in three files:

| File | Keys typed in the file |
| --- | --- |
| `src/hooks/useGameState.js` | `heroSkills_v23`, `currentProfile_v1`, `heroProfileNames_v1`, `heroParentStatus_v1`, `borderEffect_p`, `borderColor_p` |
| `src/utils/preloadStartupAssets.js` | `currentProfile_v1`, `heroSkills_v23` (a copy of the names above) |
| `src/components/PhantomEvent.jsx` | `phantomEvent_lastSpawn_v1` |

That is 21 occurrences. Two consequences:

1. **Silent data loss.** If a developer changes `v23` to `v24` in one place, the game looks for a key that does not exist, finds nothing and starts a new game. The old save stays in the browser, unused, and the player sees no error.
2. **Two files that must stay identical.** The loading screen reads the theme with its own copy of the key. If only one copy is updated, the loader preloads the wrong theme.

### Reproduction

The key rename is simulated in the browser: the save is moved from `heroSkills_v23_p1` to `heroSkills_v24_p1`, which is what the game sees after a rename in the code. Screenshots taken with the production build in headless Chromium, with a save built for the test.

**1. A player has a save: levels 22, 26, 31 and 42.**

![A save with levels 22, 26, 31 and 42](screens/debt-009-1-save-with-levels.png)

**2. The key is renamed without a migration: every skill is back to level 1.**

![After the key rename, all levels are back to 1](screens/debt-009-2-after-key-rename-data-lost.png)

The old save is still in `localStorage` under `heroSkills_v24_p1`, but nothing reads it. The game also wrote a new empty save under `heroSkills_v23_p1`.

### Fix

| Change | File |
| --- | --- |
| Every key name lives in one list (`STORAGE_KEYS`, `skillsKey(id)`, `borderEffectKey(id)`, `borderColorKey(id)`); the other files import it | `src/services/storageKeys.js` |
| `migrateKey(oldKey, newKey)` moves a saved value to a new key, never overwrites a value already saved under the new key, and does not crash if the storage is unavailable | `src/services/storageKeys.js` |
| `migrateStorage()` runs once at startup, before the game reads its saves. To rename a key in the future, add the old and new names there | `src/main.jsx` |
| The save of the original game (`heroSkills_v23`, no profile number) was read by three separate fallbacks. It is now moved to profile 1 by the migration, and the fallbacks are removed | `useGameState.js`, `preloadStartupAssets.js` |

**3. After the fix: the save under the original key is moved at startup and the levels are kept.**

![After the migration, the levels 22, 26, 31 and 42 are back](screens/debt-009-3-after-fix-save-migrated.png)

In this run, the storage held only `heroSkills_v23` before the reload. After the reload it held only `heroSkills_v23_p1`, with the same levels.

### Before and after

| | Before | After |
| --- | --- | --- |
| Files that type a key name | 3 | 0 (only `storageKeys.js`) |
| Occurrences of a key name outside the list | 21 | 0 |
| Fallbacks for the original save | 3 | 0 (one migration) |
| Renaming a key | Silent loss of the save | Add one line to `migrateStorage()` |

### Tests

| Test (`src/__tests__/storageKeys.test.js`) | What it protects |
| --- | --- |
| Key names | The names saved on players computers do not change by accident |
| `migrateKey` | Moves the value, does nothing when empty, never overwrites, survives a blocked storage |
| `migrateStorage` | The original save moves to profile 1 |
| Rename scenario | Loses the save without a migration, keeps it with one |
| Source scan | No file except `storageKeys.js` types a key name |

### Limits

- The bug is a risk, not a visible failure today: nothing is lost until a key is renamed. The screenshot simulates the rename.
- `migrateStorage()` knows one migration only (the original save). A future rename needs its own line.
- The migration moves keys, not the shape of the saved data. A change in the structure of a save needs its own conversion.
- The screenshots use a headless browser and a save built for the test, not a real player save.

## Issue #107: music only starts with the first battle

### Problem

The background music was started by `startBattle` only (`useBattle.js` calls `startBGM` from `useAudio`). On the main screen the game stayed silent, even after clicks, until the player launched a battle. Browsers refuse to play audio before a user gesture, but any click on the page is enough.

### Reproduction

Production build in headless Chromium, new save. Every call to `play()` on an audio element is recorded. The page is loaded, then the background is clicked once (no battle).

| | Before the fix | After the fix |
| --- | --- | --- |
| Music started at load | none | none (the browser would block it) |
| Music started by the first click on the background | none | `music/flowerbed-fields.mp3` |

There is no screenshot: the change is a sound.

### Fix

| Change | File |
| --- | --- |
| `useAudio` listens once for the first `pointerdown` (mouse or touch) or `keydown` on the page and starts the music, then stops listening. `startBattle` still starts it too, and starting twice does nothing | `src/hooks/useAudio.js` |

### Tests

| Test (`hooks/smallHooks.test.js`) | What it protects |
| --- | --- |
| First click | The music starts once, and later clicks or keys do not restart it |
| First key press | A keyboard player gets the music too |
| Music already playing | Nothing is started again |
| After unmount | No listener stays on the page |

Two of these tests failed before the fix and pass after.

### Limits

- The music starts on the first gesture even if it is a click on the settings, for example to lower the music volume first.

---

---

## DEBT-014: `perfectMemoryGames` never incremented

### Problem

The achievement "Perfectionist" (`src/constants/achievements.js`) says "Complete a memory game without any mismatches". It unlocks when `stats.perfectMemoryGames` is at least 1.

Nothing in the game ever raised that counter. Before the fix, the name appeared in two places only: the achievement that reads it, and the default value `0` in `src/utils/achievementUtils.js`. The memory game (`MemoryGame.jsx`) did not even count the mismatches of a game, and it reported a win with a bare `'WIN'`, so the battle code could not know whether the game was perfect.

Consequence: "Perfectionist" was impossible to unlock, for every player, however well they played.

### Reproduction

A perfect memory game is played in the game (all pairs found, no mismatch), then the menu is opened on the achievements. Production build of `main` before the fix, headless Chromium, new save, "Blocks" theme.

| | Before the fix | After the fix |
| --- | --- | --- |
| `stats.perfectMemoryGames` after the game | 0 | 1 |
| Achievements unlocked | 3 of 20 | 4 of 20 |

**Before the fix: the game was perfect, the counter stays at 0 and the Perfectionist icon (circle with a check mark) stays locked.**

![Achievements after a perfect memory game, before the fix: 3 of 20](screens/debt-014-1-before-perfect-game-not-counted.png)

**After the fix: the same game unlocks the Perfectionist achievement (4 of 20, the check mark icon is lit).**

![Achievements after a perfect memory game, after the fix: 4 of 20](screens/debt-014-2-after-perfect-game-counted.png)

### Fix

| Change | File |
| --- | --- |
| The memory game counts its mismatches (reset at the start of each game) and reports `onMathSubmit('WIN', { perfect })`, with `perfect` true when there was none | `src/components/skills/games/MemoryGame.jsx` |
| The result is passed on to the battle logic | `src/App.jsx` |
| When a memory game is won with `perfect: true`, `perfectMemoryGames` goes up by one. Other skills, and a win with no result, never change it | `src/hooks/useBattle.js` (`handleSuccessHit`) |

### Tests

| Test file | What it protects |
| --- | --- |
| `components/MemoryGame.test.jsx` | A game without a mismatch reports `perfect: true`; one mismatch makes it `perfect: false`; nothing is reported before every pair is found |
| `hooks/useBattle.perfectMemory.test.js` | The counter starts at 0, goes up on a perfect memory win, adds up over several games, ignores an imperfect win, a win with no result and other skills; "Perfectionist" unlocks |

The two test files failed before the fix (5 tests) and pass after.

### Limits

- The counter is raised when the game is won, so a game that is abandoned or lost is not counted, which is the intended rule.
- Players who already won perfect games before this fix are not credited: the game never recorded them, so there is nothing to recover.
- The screenshots use a headless browser that plays the game by itself, on a new save.

---

## Open work

| Item | Notes |
| --- | --- |
| [#37](https://github.com/0x11semprez/codewash/issues/37) `perfectMemoryGames` never incremented | The "Perfectionist" achievement cannot be unlocked |
| [#54](https://github.com/0x11semprez/codewash/issues/54) Docker build fails | `@testing-library/jest-dom` 8 wanted Vitest 5. Fixed: version 7.0.1 and a Docker build step in CI |
