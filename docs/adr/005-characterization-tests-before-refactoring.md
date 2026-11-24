# ADR-005: Characterization Tests Before Refactoring

## Status

Accepted

## Date

2026-11-23

## Context

The codebase was generated via "vibe coding" (AI-assisted rapid prototyping). It works, but the code is poorly structured: monolithic App.jsx (~800+ lines), no separation of concerns, no existing tests.

Before any cleanup or restructuring, we need to know what the code currently does, so changes can be verified as behavior-preserving.

Two approaches:

- **Write ideal tests first, then refactor**: Risk of tests encoding intended behavior that differs from actual behavior. Refactoring breaks tests for the wrong reasons.
- **Write characterization tests first**: Freeze current behavior as-is, including bugs. Refactoring that changes output is immediately detected.

## Decision

Write **characterization tests** that document and freeze the current behavior of all utility functions, constants, and UI components before any refactoring begins.

Rules:
- Tests assert what the code *does*, not what it *should* do.
- Known bugs are documented in tests with comments, not "fixed" by test assertions.
- Example: `generateMathProblem(3)` can produce negative subtraction results. The test asserts the result is an integer, documenting the bug without masking it.
- Coverage targets all exported functions in `src/utils/` and `src/constants/`.
- Component smoke tests verify rendering and basic interaction, not visual correctness.

## Consequences

### Positive

- Safety net: any refactoring that changes observable behavior triggers a test failure.
- Bug discovery: characterization testing revealed the negative math subtraction bug.
- Documentation: tests serve as executable documentation of current behavior.
- Confidence: team can refactor aggressively knowing regressions are caught.

### Negative

- Some tests encode buggy behavior: fixing bugs later requires deliberate test updates.
- Characterization tests do not validate correctness, only consistency.
- High test count (136) may slow down if not parallelized, though current run time is acceptable (~6s).
