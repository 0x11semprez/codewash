# ADR-004: GitHub Actions as CI Pipeline

## Status

Accepted

## Date

2026-11-23

## Context

The project is hosted on GitHub (Epitech organization repo + private mirror). We needed a CI pipeline to enforce quality gates on every PR. Options considered:

- **GitHub Actions**: Native to GitHub, free for public/education repos, YAML-based, large marketplace of actions.
- **GitLab CI**: Would require a separate GitLab instance or mirror.
- **Jenkins**: Self-hosted, heavy operational overhead for a student project.
- **CircleCI / Travis**: External services, additional account setup, free tier limitations.

## Decision

Use **GitHub Actions** with a single workflow file `.github/workflows/ci.yml`.

Pipeline steps (sequential):
1. Checkout code
2. Setup Node 20 with npm cache
3. Install dependencies (`npm ci`)
4. Lint (`eslint src/`)
5. Build (`vite build`)
6. Test (`vitest run`)
7. Coverage report (`vitest run --coverage`)
8. Upload coverage artifact (14-day retention)

Triggers: push to `main`, pull requests targeting `main`.

Update (2026-11-26): the pipeline now also checks the format and builds the Docker image. A second workflow, `.github/workflows/codeql.yml`, runs CodeQL static analysis on `src/` and `electron/`. The lint step also enforces complexity ceilings. See [ADR-014](014-codeql-static-analysis.md).

## Consequences

### Positive

- Zero infrastructure to maintain: runs on GitHub-hosted runners.
- Native integration: PR checks, status badges, artifact storage.
- Same pipeline runs on both Epitech repo and private mirror.
- Fail-fast: lint errors caught before build, build errors before tests.

### Negative

- GitHub Actions free tier has monthly minute limits (not an issue for this project size).
- YAML configuration can be verbose and hard to debug.
- Node 20 deprecation warning on runners (cosmetic, does not affect functionality).
