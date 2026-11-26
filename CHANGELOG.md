# Changelog

All notable changes to Level Up RPG since the team received it are listed here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project has no version tags yet (`package.json` still says `0.0.0`), so all work merged since the received version is under "Unreleased".

Links to pull requests point to this repository. Work done before the move from the Epitech organization repository is cited as "Epitech PR #N" with its merge commit, because those numbers do not exist here. Some stacked pull requests were merged into their base branch instead of `main`. Their work reached `main` later through [#66](https://github.com/0x11semprez/codewash/pull/66) and [#67](https://github.com/0x11semprez/codewash/pull/67).

## [Unreleased]

### Added

- Characterization tests that freeze the current behavior of the utilities and constants, before any refactoring (114 tests). [#3](https://github.com/0x11semprez/codewash/pull/3)
- Component smoke tests with Testing Library for `SafeImage`, `PixelHeart`, `BugReportModal`, `ResetModal` and `MobWithAura`. [#4](https://github.com/0x11semprez/codewash/pull/4)
- Vitest, jsdom and coverage packages, with a first `vitest.config.js`. Commit `881859e` (no pull request).
- GitHub Actions CI on every pull request to `main` and every push to `main`: install, lint, build, test and coverage, with the coverage report kept as an artifact for 14 days. [#5](https://github.com/0x11semprez/codewash/pull/5)
- Coverage thresholds in `vitest.config.js`. [#6](https://github.com/0x11semprez/codewash/pull/6)
- CI fails on any ESLint warning, and runs a second ESLint pass as a "Static analysis" step. [#46](https://github.com/0x11semprez/codewash/pull/46)
- Multi-stage `Dockerfile` (Node build, nginx serve) and `nginx.conf`. Epitech PR #37 (merge `6b3b960`). It did not build until DEBT-022 was fixed.
- Error tracking: the last 20 errors (uncaught errors, unhandled promise rejections and error boundary crashes) are saved in `localStorage` with their source, stack and count, with emails and credentials hidden (DEBT-013). [#36](https://github.com/0x11semprez/codewash/issues/36)
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
- `docs/SUBJECT_MAP.md`, which links each requirement of the subject to its evidence. [#55](https://github.com/0x11semprez/codewash/pull/55), [#67](https://github.com/0x11semprez/codewash/pull/67).
- Debt items DEBT-021 (missing theme images), DEBT-022 (Docker build) and DEBT-023 (direct calls to `Math.random` and `Date`). [#55](https://github.com/0x11semprez/codewash/pull/55), [#59](https://github.com/0x11semprez/codewash/issues/59).
- Runbook for the person on duty (`docs/handover/RUNBOOK.md`) and this changelog. [#57](https://github.com/0x11semprez/codewash/pull/57), [#67](https://github.com/0x11semprez/codewash/pull/67).
- Prettier with a format check in CI, and `.git-blame-ignore-revs` to skip the formatting commit ([ADR-007](docs/adr/007-prettier-code-formatting.md)). [#56](https://github.com/0x11semprez/codewash/pull/56)
- `src/utils/random.js` and `src/utils/clock.js`. Game utilities and `useGameState` accept an injected random source and clock, so tests can fix them ([ADR-008](docs/adr/008-inject-randomness-and-clock.md), DEBT-023). [#60](https://github.com/0x11semprez/codewash/pull/60), [#66](https://github.com/0x11semprez/codewash/pull/66)
- Tests that render each of the six mini-games for real, so a broken import in a game fails CI. [#58](https://github.com/0x11semprez/codewash/pull/58), [#66](https://github.com/0x11semprez/codewash/pull/66)
- Branch protection on `main`: a pull request and a green `build-and-test` check are required. No pull request (GitHub setting).
- Space and Ocean themes, made from CC0 assets (Kenney packs and OpenGameArt music and sounds). Credits are in `docs/features/themes.md`. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- Own creatures, items, music and sounds for the Monsters, Idols and Spy themes, and own music and sounds for Blocks, all CC0. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- A save migration: at startup, old theme ids and old creature names in each profile save are updated, so no progress is lost. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- CodeQL static analysis in `.github/workflows/codeql.yml`, on every pull request to `main`, every push to `main` and once a week. It uses the `security-and-quality` queries on `src/` and `electron/` ([ADR-014](docs/adr/014-codeql-static-analysis.md)). No pull request yet.
- ESLint complexity ceilings (`complexity` 58, `max-depth` 6, `max-params` 5, `max-lines-per-function` 543), set at the current maximum so no function gets worse ([ADR-014](docs/adr/014-codeql-static-analysis.md)). No pull request yet.
- French text for every theme (name, skill texts, pattern pieces) in a `"translations"` block of each theme JSON, and French text for the new UI labels, the "Titanium" badge and the "Shadow Portal" border. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- Themes are data: one folder in `public/assets/themes/<id>/` and one JSON file in `src/themes/<id>.json` per theme. The game loads every JSON file, so adding a theme needs no code ([ADR-013](docs/adr/013-themes-as-data-folders.md)). Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- Per-theme music and sound effects. The music switches as soon as the player changes theme. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- A scroll bar in the theme menu. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- `src/__tests__/themeFiles.test.js`, which checks every theme for missing files, wrong sizes, bad names and missing licenses, and names the file to fix. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- A step-by-step guide to add a theme, for non-technical readers, and the audit of the old themes: `docs/features/themes.md`. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).

- Tests for every file in `src/`: the hooks, the six mini-games, the drawers, the modals, the skill card, the bonus creature and the app itself. Coverage is now 100% for lines, statements, branches and functions. Issue [#17](https://github.com/0x11semprez/codewash/issues/17).

### Changed

- The "Static analysis" step in `ci.yml` is removed. It ran ESLint a second time with the same rules. The lint step is renamed "Lint and complexity ceilings (zero warnings)". No pull request yet.
- `App.jsx` is split into six hooks: `useGameState`, `useBattle`, `useAudio`, `useCarousel`, `useVoiceRecognition` and `useFullscreen` (DEBT-001). `App.jsx` went from 1,492 lines in the received version to 353 after this PR. Later features brought it back to 579 lines today. [#45](https://github.com/0x11semprez/codewash/pull/45)
- `SkillCard.jsx` is split into one component per mini-game under `src/components/skills/games/` (DEBT-003). [#48](https://github.com/0x11semprez/codewash/pull/48)
- Drawers, modals and the six mini-games load on demand with `React.lazy`. Display components and closed drawers are memoized. Startup JavaScript went from 392.46 kB to 319.27 kB. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Global CSS moved from `GlobalStyles.jsx` to `GlobalStyles.css`, loaded by the loading screen. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Coverage thresholds raised from 30% lines and statements and 20% functions and branches to 60% lines and statements, 50% branches and 40% functions. [#46](https://github.com/0x11semprez/codewash/pull/46)
- Coverage thresholds raised to 100% for lines, statements, branches and functions. `src/constants/assets.js` is left out of the count: it only holds placeholder paths and nothing imports it. Issue [#17](https://github.com/0x11semprez/codewash/issues/17).
- Small changes to make the last branches testable, with the same behavior: the language and theme sort functions are exported (`compareLanguages`, `compareThemes`), `PixelHeart` reads its colors from a map, and two checks that could never be false were removed from `ProfileCard` and `App`.
- Badge and difficulty images converted from PNG to SVG. Commit `7a24994` (no pull request).
- `docs/DEBT.md` links to issues and pull requests in this repository instead of the Epitech one, and its statuses are up to date. [#52](https://github.com/0x11semprez/codewash/pull/52).
- Documentation reorganized around the subject: `docs/handover/`, `docs/missions/`, `docs/features/`. [#55](https://github.com/0x11semprez/codewash/pull/55), [#67](https://github.com/0x11semprez/codewash/pull/67).
- Background music compressed from WAV (about 191 MB) to MP3. [#64](https://github.com/0x11semprez/codewash/pull/64)
- Global CSS split into five files by topic under `src/styles/` (DEBT-002, in progress). [#65](https://github.com/0x11semprez/codewash/pull/65)
- Every mini-game follows the theme: the memory cards, the pattern pieces, the spelling ("crafting table") pictures, the cleaning containers, the enemies and bosses, the bonus creature, the skill icons and the skill texts. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- Theme pictures have standard sizes (background 1280 x 720, logo 1200 x 300, card back 400 x 600, sprites 256 x 256) and fixed boxes on screen, so changing theme no longer moves or stretches anything. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- Minecraft-only names that are not part of a theme were renamed: the "Netherite" badge is "Titanium", the "Nether Portal" border is "Shadow Portal", and the default skill texts are neutral. The list and the reasons are in ADR-013. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- Themes with brand names were renamed: Minecraft is now Blocks (the default), Pokemon is now Monsters and K-Pop Demon Hunters is now Idols. Their logos, backgrounds and card backs are CC0 or drawn. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- Default creatures with Minecraft-only names were renamed, for example Creeper to Boomer and Ender Dragon to Void Dragon. The full list is in ADR-013. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- The "Mini Master", "World Ender" and "Monster Manual" achievements unlock when the player beats every creature of the group in any one theme. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).

### Fixed

- The Docker image builds again. `@testing-library/jest-dom` 8 wanted Vitest 5, so `npm ci` failed. Version 7.0.1 works with Vitest 3, so no install flag is needed anymore. CI now builds the image on every pull request, and `.dockerignore` keeps local files out of it (DEBT-022). [#54](https://github.com/0x11semprez/codewash/issues/54)
- `battlesThisSession` now resets when the game starts, so the "speed_demon" achievement needs 10 battles in one session again (DEBT-015). Epitech PR #46 (merge `a9e408a`).
- Rapid answers no longer read stale skill data in `handleSuccessHit` (DEBT-016). Epitech PR #45 (merge `7b82098`).
- Achievement checks run after the stats update instead of after a 100 ms `setTimeout` (DEBT-017). Epitech PR #44 (merge `7fa5858`).
- UI and mob sound effects play again. Their paths pointed to folders that do not exist. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Opening a battle no longer fails because of a missing `GameErrorBoundary` import in `SkillCard.jsx`. [#49](https://github.com/0x11semprez/codewash/pull/49) used the component without importing it. [#51](https://github.com/0x11semprez/codewash/pull/51)
- Two ESLint warnings about unneeded `useCallback` dependencies in `App.jsx`. [#50](https://github.com/0x11semprez/codewash/pull/50)
- A corrupted save in `localStorage` no longer crashes the game. It falls back to defaults and is backed up once to `<key>_corrupted_backup` (DEBT-018). [#58](https://github.com/0x11semprez/codewash/pull/58), [#66](https://github.com/0x11semprez/codewash/pull/66)
- Unused imports in test files that failed lint. Commit `9916a52` (no pull request).
- The four missing theme images (Spy logo, Spy, K-Pop Demon Hunters and Pokemon card backs) exist, and the Spy theme uses its own background instead of the Minecraft one (DEBT-021). The themes were renamed later in the same mission. Issue [#53](https://github.com/0x11semprez/codewash/issues/53).
- The match and mismatch sounds of the memory, pattern, math and spelling games play again. They pointed to files that do not exist. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).

### Removed

- The six default music files named after Minecraft soundtrack files (`calm1` to `calm3`, `piano1` to `piano3`). The default music is now the Blocks playlist. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).
- Dead code: seven unused functions, the unused `WRITING_ITEMS_BY_LENGTH` constant and `MenuDrawer_old.jsx` (DEBT-004). Commit `883e02f`, merged with Epitech PR #44 (merge `7fa5858`). `src/constants/assets.js` was not removed and is still unused.
- The `build-exe.yml` workflow that packaged the Electron app, and the first CI workflow from Epitech PR #37, which ran in a `CodeWashGame/` folder that does not exist. Commit `881859e` (no pull request).
- The Minecraft, Pokemon and K-Pop Demon Hunters logos, backgrounds and card backs. Unused theme files `fantasy.png`, `Scifi.png`, `pokemon_logo.svg` and an empty `text` file, and the unused `boss` and `mobType` fields of the skill and theme data. Issue [#21](https://github.com/0x11semprez/codewash/issues/21).

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
