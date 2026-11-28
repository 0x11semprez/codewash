# ADR-003: Conservative Coverage Thresholds with Ratchet Strategy

## Status

Superseded — thresholds reached 100% (lines, functions, branches, statements). The ratchet strategy completed its goal.

## Date

2026-11-23

## Context

The project started at 0% test coverage. Setting aggressive thresholds (e.g., 80%) immediately would either:

1. Block all PRs until massive test writing effort completes, or
2. Force the team to write low-quality tests just to hit numbers.

We needed thresholds that enforce forward progress without blocking current work.

## Decision

Set **conservative initial thresholds** with a ratchet-up strategy:

| Metric     | Initial Threshold |
|------------|-------------------|
| Lines      | 30%               |
| Functions  | 20%               |
| Branches   | 20%               |
| Statements | 30%               |

Thresholds are enforced in CI via Vitest's `coverage.thresholds` config. The pipeline fails if coverage drops below these values.

**Ratchet rule**: after each significant test addition, raise thresholds to match current coverage minus 5% buffer. Coverage can only go up, never down.

## Consequences

### Positive

- CI immediately catches coverage regressions: no PR can silently reduce coverage.
- Team can ship features without being blocked by unreachable coverage targets.
- Gradual improvement: each sprint raises the bar slightly.
- Thresholds reflect actual tested behavior, not arbitrary goals.

### Negative

- 30% coverage still leaves significant untested code paths.
- Ratchet requires manual threshold updates (not automated).
- Risk of complacency if thresholds are not regularly reviewed and raised.
