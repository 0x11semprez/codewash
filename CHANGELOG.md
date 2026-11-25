# Changelog

All notable changes to Level Up RPG since the team received it are listed here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project has no version tags yet (`package.json` still says `0.0.0`), so all work merged since the received version is under "Unreleased".

Links to pull requests point to this repository. Work done before the move from the Epitech organization repository is cited as "Epitech PR #N" with its merge commit, because those numbers do not exist here. Entries marked "pending" are in open pull requests and are not on `main` yet.

## [Unreleased]

### Added

- Characterization tests that freeze the current behavior of the utilities and constants, before any refactoring (114 tests). [#3](https://github.com/0x11semprez/codewash/pull/3)
- Component smoke tests with Testing Library for `SafeImage`, `PixelHeart`, `BugReportModal`, `ResetModal` and `MobWithAura`. [#4](https://github.com/0x11semprez/codewash/pull/4)
- Vitest, jsdom and coverage packages, with a first `vitest.config.js`. Commit `881859e` (no pull request).
- GitHub Actions CI on every pull request to `main` and every push to `main`: install, lint, build, test and coverage, with the coverage report kept as an artifact for 14 days. [#5](https://github.com/0x11semprez/codewash/pull/5)
- Coverage thresholds in `vitest.config.js`. [#6](https://github.com/0x11semprez/codewash/pull/6)
- CI fails on any ESLint warning, and runs a second ESLint pass as a "Static analysis" step. [#46](https://github.com/0x11semprez/codewash/pull/46)
- Multi-stage `Dockerfile` (Node build, nginx serve) and `nginx.conf`. Epitech PR #37 (merge `6b3b960`). The image does not build today, see [DEBT-022](https://github.com/0x11semprez/codewash/issues/54).
- Error boundaries: a full-page "Something went wrong" screen with a "Try Again" button, and a "Game crashed!" screen inside each skill card that ends the battle and keeps the rest of the game running (DEBT-010). [#49](https://github.com/0x11semprez/codewash/pull/49)
- Loading screen with a progress percentage. It preloads the critical images of the saved theme and offers a "Continue" button when some fail. [#51](https://github.com/0x11semprez/codewash/pull/51)
- "So... So fast !?" achievement, unlocked from the measured startup time. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Web Vitals reporting: FCP, LCP and CLS are printed in the browser console as `[web-vitals] ...`. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Performance regression test that keeps drawers, modals and mini-games out of the startup bundle. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Performance report. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Technical debt register (`docs/DEBT.md`) and development plan. Commit `a1cc9aa` (no pull request), then [#2](https://github.com/0x11semprez/codewash/pull/2).
- Baseline dependency graph in `docs/DEBT.md`. Epitech PR #48 (merge `f69df57`).
- README, `.gitignore` and six architecture decision records in `docs/adr/`. [#7](https://github.com/0x11semprez/codewash/pull/7)
- `.gitignore` rules for macOS metadata files such as `._*` (DEBT-007). [#47](https://github.com/0x11semprez/codewash/pull/47)
- `docs/SUBJECT_MAP.md`, which links each requirement of the subject to its evidence. Pending [#55](https://github.com/0x11semprez/codewash/pull/55).
- Debt items DEBT-021 (missing theme images) and DEBT-022 (Docker build). Pending [#55](https://github.com/0x11semprez/codewash/pull/55).
- Runbook for the person on duty (`docs/handover/RUNBOOK.md`) and this changelog. Pending (this pull request).

### Changed

- `App.jsx` is split into six hooks: `useGameState`, `useBattle`, `useAudio`, `useCarousel`, `useVoiceRecognition` and `useFullscreen` (DEBT-001). `App.jsx` went from 1,492 lines in the received version to 353 today. [#45](https://github.com/0x11semprez/codewash/pull/45)
- `SkillCard.jsx` is split into one component per mini-game under `src/components/skills/games/` (DEBT-003). [#48](https://github.com/0x11semprez/codewash/pull/48)
- Drawers, modals and the six mini-games load on demand with `React.lazy`. Display components and closed drawers are memoized. Startup JavaScript went from 392.46 kB to 319.27 kB. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Global CSS moved from `GlobalStyles.jsx` to `GlobalStyles.css`, loaded by the loading screen. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Coverage thresholds raised from 30% lines and statements and 20% functions and branches to 60% lines and statements, 50% branches and 40% functions. [#46](https://github.com/0x11semprez/codewash/pull/46)
- Badge and difficulty images converted from PNG to SVG. Commit `7a24994` (no pull request).
- `docs/DEBT.md` links to issues and pull requests in this repository instead of the Epitech one, and its statuses are up to date. Pending [#52](https://github.com/0x11semprez/codewash/pull/52).
- Documentation reorganized around the subject: `docs/handover/`, `docs/missions/`, `docs/features/`. Pending [#55](https://github.com/0x11semprez/codewash/pull/55).

### Fixed

- `battlesThisSession` now resets when the game starts, so the "speed_demon" achievement needs 10 battles in one session again (DEBT-015). Epitech PR #46 (merge `a9e408a`).
- Rapid answers no longer read stale skill data in `handleSuccessHit` (DEBT-016). Epitech PR #45 (merge `7b82098`).
- Achievement checks run after the stats update instead of after a 100 ms `setTimeout` (DEBT-017). Epitech PR #44 (merge `7fa5858`).
- UI and mob sound effects play again. Their paths pointed to folders that do not exist. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Opening a battle no longer fails because of a missing `GameErrorBoundary` import in `SkillCard.jsx`. [#49](https://github.com/0x11semprez/codewash/pull/49) used the component without importing it. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Two ESLint warnings about unneeded `useCallback` dependencies in `App.jsx`. [#50](https://github.com/0x11semprez/codewash/pull/50)
- Unused imports in test files that failed lint. Commit `9916a52` (no pull request).

### Removed

- Dead code: seven unused functions, the unused `WRITING_ITEMS_BY_LENGTH` constant and `MenuDrawer_old.jsx` (DEBT-004). Commit `883e02f`, merged with Epitech PR #44 (merge `7fa5858`). `src/constants/assets.js` was not removed and is still unused.
- The `build-exe.yml` workflow that packaged the Electron app, and the first CI workflow from Epitech PR #37, which ran in a `CodeWashGame/` folder that does not exist. Commit `881859e` (no pull request).

## [0.0.0] - 2026-11-18

The received version: commit `f12cd74`, plus the original assets added right after it in commit `a4f337f` (mob images, difficulty icons, UI sounds, screenshots).

What the team received:

- A React 19 and Vite game with an Electron shell, written by a non-developer with AI tools.
- 6,938 source lines in 25 files. `App.jsx` held all the game state and logic in 1,492 lines.
- No tests and no test framework.
- One GitHub Actions workflow, `build-exe.yml`, that packaged the Electron app. No lint, test or build check.
- No Dockerfile.
- No README.
- Two dead files (`MenuDrawer_old.jsx`, `assets.js`) and seven unused functions.

The full baseline is described in [docs/DEBT.md](docs/DEBT.md#1-codebase-map).
