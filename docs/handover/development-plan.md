# Software development plan

> This is the plan the team wrote at the start of the project. Two points differ from what the team does today:
>
> - There are no `release/*` branches. Feature and fix branches merge into `main` through a pull request.
> - The `Dockerfile` is at the repository root, not in `CodeWashGame/`. Its build currently fails ([DEBT-022](../DEBT.md#debt-022-docker-build-fails-on-npm-ci-p1-open)).

## 1. Project overview

CodeWash: professional cleanup of a vibe-coded React game (CodeWashGame).

The goal is to turn a monolithic, untested codebase into something maintainable, tested, and containerized. We follow the CodeWash Inc. protocol: pre-wash, directed jet, controlled rinse, hot-spot treatment, finishing pass.

## 2. Branch strategy

### 2.1 Branch types

| Branch | Pattern | Purpose | Lifespan |
|--------|---------|---------|----------|
| `main` | `main` | Production-ready code. Every commit passes full CI + review | Permanent |
| `release` | `release/*` | Stabilization before merge to main. Integration testing + container build | Short-lived |
| `feature/fix` | `feature/*` or `fix/*` | One issue per branch | Short-lived |

### 2.2 Branch flow

```
feature/DEBT-001-dead-code ──┐
fix/DEBT-005-bug-report    ──┤
feature/DEBT-003-split-app ──┼──► release/v1.0 ──► main
feature/DEBT-010-perf      ──┤
fix/DEBT-012-translation   ──┘
```

### 2.3 Branch rules

- Feature/fix branches are created from `main`
- Release branches are created from `main` after merging approved feature/fix PRs
- `main` only receives merges from release branches (via reviewed PR)
- Branch names follow: `type/DEBT-XXX-short-description`

## 3. CI/CD pipeline

### 3.1 Feature/fix branches (`feature/*`, `fix/*`)

Triggered on: push, pull request

```yaml
Steps:
  1. Install dependencies (npm ci)
  2. Lint (eslint)
  3. Unit tests (vitest run)
  4. Coverage check (80% on modified files, 100% on new files)
```

### 3.2 Release branches (`release/*`)

Triggered on: push, pull request

```yaml
Steps:
  1. Install dependencies (npm ci)
  2. Lint (eslint)
  3. Full test suite (vitest run --coverage)
  4. Build application (vite build)
  5. Build Docker container (local only)
  6. Run container smoke test
```

### 3.3 Main branch (`main`)

Triggered on: pull request only (requires review)

```yaml
Steps:
  1. Install dependencies (npm ci)
  2. Lint (eslint)
  3. Full test suite (vitest run --coverage)
  4. Build application (vite build)
  5. Build Docker container (local only)
  6. Run container smoke test
  7. Require 1 approving review
```

## 4. Docker configuration (local only)

- Multi-stage build: Node for build, Nginx for serve
- Container runs locally only, no registry push
- Used for integration validation on release and main branches
- Dockerfile lives at the repository root

## 5. Testing strategy

| Scope | Tool | Coverage target |
|-------|------|-----------------|
| Unit tests | Vitest | 80% on modified code, 100% on new code |
| Characterization tests | Vitest | Capture existing behavior before refactoring |
| Component tests | Vitest + Testing Library | UI component behavior |

### 5.1 Test phases

1. Phase 0 (pre-wash): write characterization tests for existing behavior
2. Phases 1-3 (refactoring): keep tests green at every step
3. Phase 4 (features): TDD for new features (bug reporting, translation, performance, new game)

## 6. Development phases

### Phase 0: pre-wash (characterization)
- Write characterization tests for `gameUtils.js`, `achievementUtils.js`, `soundManager.js`
- Establish baseline coverage
- Set up CI pipeline
- Set up Docker build

### Phase 1: directed jet (separate I/O)
- Remove dead code (8 functions + 2 files)
- Extract components from `App.jsx` (1,492 lines)
- Split `GlobalStyles.jsx` into module CSS
- Separate pure logic from side effects

### Phase 2: controlled rinse (CI + coverage)
- Enforce coverage thresholds in CI
- Add pre-commit hooks (lint, test)
- Configure branch protection rules

### Phase 3: hot-spot treatment
- Refactor `App.jsx` state management (218 decision points)
- Optimize `SkillCard.jsx` (778 lines, 6 skill types)
- Performance monitoring with metrics

### Phase 4: finishing pass (missions)
Choose 4 from subject requirements:
- Performance optimization
- Bug reporting system
- Translation (i18n)
- Themes
- New game mode
- New game+ mode

## 7. Quality gates

| Gate | Requirement |
|------|-------------|
| PR to release | Tests pass, lint clean, coverage met |
| PR to main | All above + 1 approving review |
| Release tag | All tests green, container builds, smoke test passes |

## 8. Tools and stack

| Tool | Purpose |
|------|---------|
| Vite (rolldown-vite 7.2.5) | Build tool |
| React 19 | UI framework |
| Tailwind CSS | Styling |
| Vitest | Testing |
| ESLint | Linting |
| Docker + Nginx | Local containerization |
| GitHub Actions | CI/CD |
| GitHub Projects | Issue tracking |
