# Subject map

This page follows the CodeWash subject in order. Each row is one requirement, its status today, and the file, issue or pull request that proves it.

Status values:

- **Done**: the requirement is met and the evidence is linked.
- **Partial**: some of it is done. The row says what is missing.
- **Missing**: nothing is done yet.

Last checked: 2026-11-26.

## Code Wash protocol

| Step | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Pre-wash: characterization tests freeze current behavior | Done | `src/__tests__/` (17 files and 170 tests at that point, 24 files and 237 tests today), PR [#3](https://github.com/0x11semprez/codewash/pull/3), [ADR-005](adr/005-characterization-tests-before-refactoring.md) | |
| Directed jet: separate domain from I/O, inject clock and config, remove globals | Partial | [ADR-008](adr/008-inject-randomness-and-clock.md), [#60](https://github.com/0x11semprez/codewash/pull/60) (DEBT-023), `src/services/storage.js` ([#58](https://github.com/0x11semprez/codewash/pull/58), DEBT-018), `src/services/storageKeys.js` ([#70](https://github.com/0x11semprez/codewash/pull/70), DEBT-009) | 16 direct calls to `Math.random()`, `Date.now()` or `new Date(` are left, in `useBattle`, `soundManager`, `PhantomEvent`, `MemoryGame` and `PatternGame` (`npm run metrics`). The sound manager is a module singleton ([DEBT-011](DEBT.md#debt-011-sound-manager--singleton--no-audio-pooling-p3-open)). |
| Controlled rinse: CI green, coverage thresholds visible | Done | `.github/workflows/ci.yml`, `vitest.config.js` | |
| Hot-spot treatment: duplication, coupling, fragile parsers, silent errors | Partial | DEBT-001 ([#45](https://github.com/0x11semprez/codewash/pull/45)), DEBT-003 ([#48](https://github.com/0x11semprez/codewash/pull/48)), DEBT-010 ([#49](https://github.com/0x11semprez/codewash/pull/49)), DEBT-018 ([#58](https://github.com/0x11semprez/codewash/pull/58)), DEBT-013 ([#83](https://github.com/0x11semprez/codewash/pull/83)). Duplication went from 6.01% to 1.03% ([DEBT.md section 8](DEBT.md#8-final-metrics)) | DEBT-002 is partly done ([#65](https://github.com/0x11semprez/codewash/pull/65)). DEBT-008 is open. |
| Finishing pass: small features, public contracts kept, clean handover | Partial | Performance mission ([#51](https://github.com/0x11semprez/codewash/pull/51)) | Three more missions and the handover documents below. |
| First push is the project as received | Done | Commit `f12cd74` | |

## Launch the project

| Requirement | Status | Evidence | Missing |
| --- | --- | --- | --- |
| The project runs | Done | [README](../README.md#quick-start) | |
| The launch process is documented | Partial | [README](../README.md#quick-start) gives the commands | A short write-up of how the team got the original Windows project running, what failed and how the peer dependency conflict was fixed. |
| The Docker image builds | Done | `Dockerfile`, `.dockerignore`, "Docker build" step in `.github/workflows/ci.yml` | |

## Map the debt

| Requirement | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Map of the codebase: modules, call graph, state, I/O | Done | Received version: [DEBT.md section 1](DEBT.md#1-codebase-map). Today: [ARCHITECTURE.md](ARCHITECTURE.md) | |
| One entry per debt item: location, smell, impact, risk, effort, priority, status | Done | [DEBT.md section 2](DEBT.md#2-debt-items), 22 items | |
| Baseline metrics with named tools | Done | [DEBT.md section 3](DEBT.md#3-baseline-metrics), before and after numbers in [section 8](DEBT.md#8-final-metrics), `npm run metrics` (`tools/measure-metrics.mjs`) | The old complexity regex and jscpd version were not saved, so section 8 measures the received version again with the new script. |
| Risk matrix and phased attack plan | Done | [DEBT.md sections 4 and 5](DEBT.md#4-risk-matrix) | |
| Debt items exist as GitHub issues | Done | Issues [#24](https://github.com/0x11semprez/codewash/issues/24) to [#42](https://github.com/0x11semprez/codewash/issues/42), [#53](https://github.com/0x11semprez/codewash/issues/53), [#54](https://github.com/0x11semprez/codewash/issues/54) | |
| Every refactoring PR names its debt item | Partial | [#45](https://github.com/0x11semprez/codewash/pull/45), [#48](https://github.com/0x11semprez/codewash/pull/48), [#49](https://github.com/0x11semprez/codewash/pull/49) | [#50](https://github.com/0x11semprez/codewash/pull/50) names no item. |

## Build the safety net

| Requirement | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Test suite in a single command | Done | `npm test` | |
| CI on every pull request: build, tests, lint, format, coverage | Done | `.github/workflows/ci.yml`, format check since [#56](https://github.com/0x11semprez/codewash/pull/56) | |
| Quality gates block the merge | Partial | CI fails on a test failure, a lint warning or low coverage | `main` is protected since 2026-11-25: a pull request is required, the `build-and-test` check must pass on an up-to-date branch, and force pushes and deletion are blocked. Admins can still bypass the rule. |
| Static analysis in the pipeline | Done | `.github/workflows/codeql.yml` (CodeQL, `security-and-quality` queries on `src/` and `electron/`), complexity ceilings in `eslint.config.js`, [ADR-014](adr/014-codeql-static-analysis.md) | The CodeQL checks are not yet required in the branch protection of `main`. The complexity ceilings only block regressions. |
| New code fully covered, 80% of modified lines | Done | `vitest.config.js` | Global thresholds are 100% for lines, statements, branches and functions, so new code without tests fails CI. There is no separate diff coverage check. |
| Lowered thresholds are written down as debt | Done | [ADR-003](adr/003-conservative-coverage-thresholds.md) | |
| Tests can control the clock and random numbers | Partial | [ADR-008](adr/008-inject-randomness-and-clock.md), `src/__tests__/gameUtils.deterministic.test.js`, `src/__tests__/useGameState.clock.test.js` | Same 16 calls as in "Directed jet" above. |

## Hand over cleanly

| Question from the subject | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Can a newcomer install, launch and test without help? | Done | [README](../README.md) | |
| Why is the architecture the way it is? | Partial | [docs/adr/](adr/) (8 ADRs) | The ADRs cover tooling and file layout. No ADR explains the hook design or the loading gate. |
| What changed between the version received and the one delivered? | Done | [CHANGELOG.md](../CHANGELOG.md) | |
| What should the person on duty do when something breaks? | Done | [Runbook](handover/RUNBOOK.md) | |
| What does the system look like today? | Done | [ARCHITECTURE.md](ARCHITECTURE.md): module graph, state, I/O, main flows, folder map, and a five-minute demo path | |
| How does a user discover each added feature? | Partial | [Performance report](missions/performance.md) | One page per mission, written for players. |
| What was left undone, and why? | Done | [DEBT.md section 9](DEBT.md#9-residual-debt-handed-over): residual debt with the reason for each item | |

## Missions (choose 4)

| Mission | Status | Evidence | Missing |
| --- | --- | --- | --- |
| Improve performance | Partial | [#51](https://github.com/0x11semprez/codewash/pull/51), [performance report](missions/performance.md) | A fair Lighthouse comparison on the same theme ([#18](https://github.com/0x11semprez/codewash/issues/18)). |
| Bug reporting | Missing | | `BugReportModal.jsx` is a 19-line stub ([#19](https://github.com/0x11semprez/codewash/issues/19)). |
| Translation | Missing | | No i18n code. Issue [#20](https://github.com/0x11semprez/codewash/issues/20) was closed without a pull request. |
| Themes | Done, not merged yet | [themes guide and audit](features/themes.md), [ADR-013](adr/013-themes-as-data-folders.md), `src/__tests__/themeFiles.test.js` | [#21](https://github.com/0x11semprez/codewash/issues/21). The Blocks theme still uses the creature pictures the game came with (see Known limits in the guide). |
| New game (trivia) | Missing | | No issue yet. |
| New game+ | Missing | | Needs the trivia game first. |
