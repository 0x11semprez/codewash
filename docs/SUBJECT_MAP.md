# Subject map

This page follows the CodeWash subject in order. Each row is one requirement, its status today, and the file, issue or pull request that proves it.

Status values:

- **Done**: the requirement is met and the evidence is linked.
- **Partial**: some of it is done. The row says what is missing.
- **Missing**: nothing is done yet.
- **Not chosen**: an optional mission the team did not pick. The subject asks for 4 missions out of 6.

Last checked: 2026-11-26.

## Code Wash protocol

| Step | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Pre-wash: characterization tests freeze current behavior | Done | `src/__tests__/` (17 files and 170 tests at that point, 30 files today), PR [#3](https://github.com/0x11semprez/codewash/pull/3), [ADR-005](adr/005-characterization-tests-before-refactoring.md) | |
| Directed jet: separate domain from I/O, inject clock and config, remove globals | Partial | [ADR-008](adr/008-inject-randomness-and-clock.md), [#60](https://github.com/0x11semprez/codewash/pull/60) (DEBT-023), `src/services/storage.js` ([#58](https://github.com/0x11semprez/codewash/pull/58), DEBT-018), `src/services/storageKeys.js` ([#70](https://github.com/0x11semprez/codewash/pull/70), DEBT-009), [ARCHITECTURE.md, where I/O happens](ARCHITECTURE.md#where-io-happens) | 16 direct calls to `Math.random()`, `Date.now()` or `new Date(` are left (`npm run metrics`). Most are in `useBattle`, `soundManager`, `PhantomEvent`, `MemoryGame` and `PatternGame`. The sound manager is still a module singleton ([DEBT-011](DEBT.md#debt-011-sound-manager--singleton--no-audio-pooling-p3-open), issue [#34](https://github.com/0x11semprez/codewash/issues/34)). |
| Controlled rinse: CI green, coverage thresholds visible | Done | `.github/workflows/ci.yml`, `vitest.config.js` (100% thresholds since [#80](https://github.com/0x11semprez/codewash/pull/80)), [ADR-004](adr/004-github-actions-ci-pipeline.md) | |
| Hot-spot treatment: duplication, coupling, fragile parsers, silent errors | Partial | DEBT-001 ([#45](https://github.com/0x11semprez/codewash/pull/45)), DEBT-003 ([#48](https://github.com/0x11semprez/codewash/pull/48)), DEBT-010 ([#49](https://github.com/0x11semprez/codewash/pull/49)), DEBT-018 ([#58](https://github.com/0x11semprez/codewash/pull/58)), DEBT-014 ([#82](https://github.com/0x11semprez/codewash/pull/82)), DEBT-013 ([#83](https://github.com/0x11semprez/codewash/pull/83)), DEBT-008 ([#90](https://github.com/0x11semprez/codewash/pull/90)). Duplication went from 6.01% to 1.03% ([DEBT.md section 8](DEBT.md#8-final-metrics)) | DEBT-002 is only partly done ([#65](https://github.com/0x11semprez/codewash/pull/65)): the global CSS class names stay (issue [#25](https://github.com/0x11semprez/codewash/issues/25)). The function quality work in the game utils is still open (issue [#12](https://github.com/0x11semprez/codewash/issues/12)). |
| Finishing pass: small features, public contracts kept, clean handover | Done | Four missions merged (see [Missions](#missions-choose-4)), saved games kept by the storage key migration ([#70](https://github.com/0x11semprez/codewash/pull/70)), handover documents below | |
| First push is the project as received | Done | Commit `f12cd74` | |

## Launch the project

| Requirement | Status | Evidence | Missing |
| --- | --- | --- | --- |
| The project runs | Done | [README](../README.md#quick-start) | |
| The launch process is documented | Partial | [README](../README.md#quick-start) gives the commands. The [runbook](handover/RUNBOOK.md#npm-install-fails-with-eresolve) explains how to fix a peer dependency conflict | A short write-up of how the team got the original Windows project running and what failed at first. |
| The Docker image builds | Done | `Dockerfile`, `.dockerignore`, "Docker build" step in `.github/workflows/ci.yml`, fixed in [#81](https://github.com/0x11semprez/codewash/pull/81) (DEBT-022), [runbook](handover/RUNBOOK.md#docker-build-fails) | |

## Map the debt

| Requirement | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Map of the codebase: modules, call graph, state, I/O | Done | Received version: [DEBT.md section 1](DEBT.md#1-codebase-map). Today: [ARCHITECTURE.md](ARCHITECTURE.md) | |
| One entry per debt item: location, smell, impact, risk, effort, priority, status | Done | [DEBT.md section 2](DEBT.md#2-debt-items), 23 items (DEBT-001 to DEBT-023) | |
| Baseline metrics with named tools | Done | [DEBT.md section 3](DEBT.md#3-baseline-metrics), before and after numbers in [section 8](DEBT.md#8-final-metrics), `npm run metrics` (`tools/measure-metrics.mjs`) | The old complexity regex and jscpd version were not saved, so section 8 measures the received version again with the new script. |
| Risk matrix and phased attack plan | Done | [DEBT.md sections 4 and 5](DEBT.md#4-risk-matrix) | |
| Debt items exist as GitHub issues | Done | Issues [#24](https://github.com/0x11semprez/codewash/issues/24) to [#42](https://github.com/0x11semprez/codewash/issues/42), [#53](https://github.com/0x11semprez/codewash/issues/53), [#54](https://github.com/0x11semprez/codewash/issues/54), [#59](https://github.com/0x11semprez/codewash/issues/59) | |
| Every refactoring PR names its debt item | Partial | [#45](https://github.com/0x11semprez/codewash/pull/45), [#48](https://github.com/0x11semprez/codewash/pull/48), [#49](https://github.com/0x11semprez/codewash/pull/49), [#58](https://github.com/0x11semprez/codewash/pull/58), [#60](https://github.com/0x11semprez/codewash/pull/60), [#65](https://github.com/0x11semprez/codewash/pull/65), [#68](https://github.com/0x11semprez/codewash/pull/68), [#70](https://github.com/0x11semprez/codewash/pull/70), [#72](https://github.com/0x11semprez/codewash/pull/72), [#81](https://github.com/0x11semprez/codewash/pull/81), [#82](https://github.com/0x11semprez/codewash/pull/82), [#83](https://github.com/0x11semprez/codewash/pull/83), [#90](https://github.com/0x11semprez/codewash/pull/90) | [#50](https://github.com/0x11semprez/codewash/pull/50) names no item. |

## Build the safety net

| Requirement | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Test suite in a single command | Done | `npm test` | |
| CI on every pull request: build, tests, lint, format, coverage | Done | `.github/workflows/ci.yml`: lint with complexity ceilings, format check (since [#56](https://github.com/0x11semprez/codewash/pull/56)), build, tests, coverage with 100% thresholds, Docker build | |
| Quality gates block the merge | Done | `main` is protected: a pull request is required, the `build-and-test` check must pass on an up-to-date branch, and force pushes and deletion are blocked. CI fails on a test failure, a lint warning, a format error or coverage under 100% | Admins can still bypass the rule. The CodeQL checks are not required. |
| Static analysis in the pipeline | Done | `.github/workflows/codeql.yml` (CodeQL, `security-and-quality` queries on `src/` and `electron/`), complexity ceilings in `eslint.config.js`, [#85](https://github.com/0x11semprez/codewash/pull/85), [ADR-014](adr/014-codeql-static-analysis.md) | The CodeQL checks are not yet required in the branch protection of `main`. The complexity ceilings only block regressions. |
| New code fully covered, 80% of modified lines | Done | `vitest.config.js`, [#80](https://github.com/0x11semprez/codewash/pull/80) | Global thresholds are 100% for lines, statements, branches and functions, so new code without tests fails CI. There is no separate diff coverage check. |
| Lowered thresholds are written down as debt | Done | [ADR-003](adr/003-conservative-coverage-thresholds.md) records the ratchet rule. Since [#80](https://github.com/0x11semprez/codewash/pull/80) no threshold is lowered | ADR-003 still shows the first values (30% and 20%). |
| Tests can control the clock and random numbers | Partial | [ADR-008](adr/008-inject-randomness-and-clock.md), `src/__tests__/gameUtils.deterministic.test.js`, `src/__tests__/useGameState.clock.test.js` | Same 16 calls as in "Directed jet" above. |

## Hand over cleanly

| Question from the subject | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Can a newcomer install, launch and test without help? | Done | [README](../README.md) | |
| Why is the architecture the way it is? | Partial | [docs/adr/](adr/) (14 ADRs), [ARCHITECTURE.md](ARCHITECTURE.md#decisions-and-feature-docs) | No ADR explains the split of `App.jsx` into hooks ([#45](https://github.com/0x11semprez/codewash/pull/45)) or the loading screen that waits for the critical images ([#51](https://github.com/0x11semprez/codewash/pull/51)). |
| What changed between the version received and the one delivered? | Done | [CHANGELOG.md](../CHANGELOG.md) | |
| What should the person on duty do when something breaks? | Done | [Runbook](handover/RUNBOOK.md), error tracking in `localStorage` ([#83](https://github.com/0x11semprez/codewash/pull/83)) | |
| What does the system look like today? | Done | [ARCHITECTURE.md](ARCHITECTURE.md): module graph, state, I/O, main flows, folder map, and a five-minute demo path | |
| How does a user discover each added feature? | Done | [Bug reporting](features/bug-reporting.md), [translation](features/translation.md), [themes](features/themes.md), [performance report](missions/performance.md) | |
| What was left undone, and why? | Done | [DEBT.md section 9](DEBT.md#9-residual-debt-handed-over): residual debt with the reason for each item. Open issues [#12](https://github.com/0x11semprez/codewash/issues/12), [#25](https://github.com/0x11semprez/codewash/issues/25), [#34](https://github.com/0x11semprez/codewash/issues/34) | |

## Missions (choose 4)

| Mission | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Improve performance | Done | [#51](https://github.com/0x11semprez/codewash/pull/51), [#64](https://github.com/0x11semprez/codewash/pull/64), [#75](https://github.com/0x11semprez/codewash/pull/75), [#76](https://github.com/0x11semprez/codewash/pull/76), fair Lighthouse comparison on the same theme in [#89](https://github.com/0x11semprez/codewash/pull/89), [performance report](missions/performance.md), [ADR-010](adr/010-pause-offscreen-animations.md), [ADR-011](adr/011-animated-webp-instead-of-gif.md), issue [#18](https://github.com/0x11semprez/codewash/issues/18) | |
| Bug reporting | Done | [#77](https://github.com/0x11semprez/codewash/pull/77), [bug reporting guide](features/bug-reporting.md), [ADR-009](adr/009-bug-reporting.md), issue [#19](https://github.com/0x11semprez/codewash/issues/19) | |
| Translation | Done | [#78](https://github.com/0x11semprez/codewash/pull/78) (English and French), language button in the main menu [#87](https://github.com/0x11semprez/codewash/pull/87), [translation guide](features/translation.md), [ADR-012](adr/012-translation.md), issue [#20](https://github.com/0x11semprez/codewash/issues/20) | |
| Themes | Done | [#79](https://github.com/0x11semprez/codewash/pull/79), [themes guide and audit](features/themes.md), [ADR-013](adr/013-themes-as-data-folders.md), `src/__tests__/themeFiles.test.js`, issue [#21](https://github.com/0x11semprez/codewash/issues/21) | The Blocks theme still uses the creature pictures the game came with (see [Known limits](features/themes.md#known-limits)). |
| New game (trivia) | Not chosen | | |
| New game+ | Not chosen | | |
