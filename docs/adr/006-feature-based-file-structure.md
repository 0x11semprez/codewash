# ADR-006: Migration to Feature-Based File Structure

## Status

Partly adopted — hooks, mini-games, services and game data are split by topic. The full `src/features/` layout was not started and is deferred as residual debt.

## Date

2026-11-23

## Context

Current structure is flat, organized by file type:

```
src/
  utils/gameUtils.js
  utils/achievementUtils.js
  utils/soundManager.js
  constants/gameData.jsx
  constants/achievements.js
  components/ui/SafeImage.jsx
  components/modals/ResetModal.jsx
  App.jsx              (800+ lines, all game state)
```

This structure does not scale. Adding a feature requires touching files across multiple directories. Related code (a battle component, its utils, its constants) lives in separate trees.

The branch `refactor/debt-020-file-reorganization` proposes a feature-based layout:

```
src/
  features/
    battle/
      components/
      utils/
      constants/
    achievements/
      components/
      utils/
      constants/
    cleaning/
      ...
  shared/
    components/ui/
    utils/
    constants/
```

## Progress

- Hooks live in `src/hooks/` ([#45](https://github.com/0x11semprez/codewash/pull/45)). Each mini-game has its own file in `src/components/skills/games/` ([#48](https://github.com/0x11semprez/codewash/pull/48)).
- Game data is split by topic in `src/constants/game/`. `src/constants/gameData.js` re-exports it, so imports did not change.
- Code that talks to the browser (`soundManager`, `storage`, `storageKeys`) lives in `src/services/`. `src/utils/` holds pure game logic.
- The `src/features/` folders are not started.

## Decision

Migrate from flat type-based structure to **feature-based structure** where each game feature owns its components, utils, and constants.

Migration strategy:
1. Characterization tests in place first (ADR-005). **Done.**
2. Move files in small PRs, one feature at a time.
3. Update import paths. Run tests after each move.
4. Extract state management from App.jsx into feature-specific hooks.
5. Shared utilities (sound, images) stay in `src/shared/`.

## Consequences

### Positive

- Feature isolation: adding or modifying a feature touches one directory.
- Clearer ownership: easier to review PRs scoped to a feature.
- Scales with codebase growth: new features get their own directories.
- Enables future extraction of features into lazy-loaded modules.

### Negative

- Large migration effort: every import path changes.
- Risk of regressions during migration (mitigated by characterization tests).
- Some utilities are genuinely shared (sound, math helpers): deciding where they live requires judgment.
- Team needs to agree on directory naming conventions.
