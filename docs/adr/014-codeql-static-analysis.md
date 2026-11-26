# ADR-014: CodeQL for static analysis and ESLint complexity ceilings

## Status

Accepted

## Date

2026-11-26

## Context

The subject asks for static analysis in the pipeline and for quality gates that block the merge.

Until now, `ci.yml` had a step called "Static analysis". It ran `eslint src/` a second time with the same rules as the lint step, so it found nothing the lint step had not already found. ESLint also skips `electron/`, so the Electron main process was never checked at all.

ESLint checks style and common mistakes inside one file. It does not follow data from one place to another, so it cannot see, for example, user text that reaches `innerHTML`, or a remote URL that reaches `shell.openExternal` in Electron. It also had no rule on how complex a function may get.

Options considered:

- CodeQL (GitHub code scanning): free for public repositories, runs in GitHub Actions, follows data across files, shows results as alerts on the pull request.
- SonarCloud: also free for public projects, but it needs an outside account, a token stored as a secret and its own quality gate settings.
- Semgrep: fast pattern rules, but the free rule set for JavaScript and Electron is smaller, and data flow across files is a paid feature.
- More ESLint plugins (for example `eslint-plugin-security`): still one file at a time, with many false alarms.

## Decision

### CodeQL in its own workflow

`.github/workflows/codeql.yml` follows the official `github/codeql-action` v3 template:

- It runs on every pull request to `main`, on every push to `main`, and every Monday at 04:17 UTC. The weekly run picks up new CodeQL queries on code that did not change.
- Language `javascript-typescript` with `build-mode: none`. JavaScript needs no build for CodeQL.
- The settings are in `.github/codeql/codeql-config.yml`. The query suite is `security-and-quality`, which adds maintainability and reliability queries to the default security queries. Only `src/` and `electron/` are analyzed. `dist`, `coverage` and `node_modules` are ignored.
- Results go to the Security tab of the repository, under Code scanning. On a pull request, GitHub adds a "CodeQL" check and comments on the changed lines that have an alert.

The job is called `Analyze (javascript-typescript)`. It fails when CodeQL itself cannot run. The separate `CodeQL` check fails when the pull request adds an alert of severity "error", or a security alert of severity "high" or "critical". Both checks have to be required in the branch protection of `main` to block the merge.

CodeQL default setup is off for this repository. GitHub does not allow default setup and this workflow at the same time.

### One ESLint step with complexity ceilings

The duplicate "Static analysis" step is removed from `ci.yml`. The lint step is renamed "Lint and complexity ceilings (zero warnings)" and runs once.

`eslint.config.js` now has four complexity rules. We measured the largest value in `src/` today and set each limit at that value. The current code passes, and a change that makes the worst function worse fails CI.

| Rule | Limit | Where the current maximum is |
| --- | --- | --- |
| `complexity` | 58 | `src/components/skills/SkillCard.jsx`, the `SkillCard` component (line 24) |
| `max-depth` | 6 | `src/hooks/useBattle.js`, line 304 |
| `max-params` | 5 | `src/i18n/gameText.js` line 25 and `src/hooks/useBattle.js` line 51 |
| `max-lines-per-function` | 543 (blank lines and comments not counted) | `src/App.jsx`, the `App` component at line 30 |

Other large values today: complexity 31 in `useGameState.js` (line 67) and `useBattle.js` (line 156), complexity 27 in `MenuDrawer.jsx` (line 177), and functions of 473 lines (`SkillCard.jsx`), 364 lines (`useBattle.js`) and 319 lines (`CosmeticsDrawer.jsx`).

These limits are high. Common limits are 10 to 20 for complexity and 4 for depth. They are set at today's values so the code does not get worse. When a pull request splits one of these functions, it lowers the limit in `eslint.config.js` to the new maximum in the same pull request.

To measure a rule again, run it with a limit of zero and look at the largest number in the messages:

```bash
npx eslint src/ --rule '{"complexity":["warn",0]}'
```

## Consequences

### Positive

- The pipeline has a real static analysis tool. CodeQL follows data across files and covers `electron/`, which ESLint skips.
- Alerts are listed in one place (Security > Code scanning), with the path, the line and an explanation for each one.
- CI runs ESLint once instead of twice.
- The most complex functions cannot get more complex without someone changing a limit on purpose, in a reviewed pull request.

### Negative

- CodeQL adds a few minutes to each pull request. It runs as a separate workflow, so it runs at the same time as `build-and-test`.
- `security-and-quality` reports more than the default suite, so some alerts may be false alarms. They are dismissed in GitHub with a reason (see the runbook).
- CodeQL cannot run on a laptop without installing the CodeQL CLI. The team relies on the GitHub run.
- The complexity limits only block regressions. They do not make the current hotspots simpler.
- The limits apply to test files in `src/` too. The largest values in tests today are complexity 13, depth 2, 4 parameters and 140 lines.
