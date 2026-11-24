# ADR-002: Testing Library for Component Tests

## Status

Accepted

## Date

2026-11-23

## Context

With Vitest chosen (ADR-001), we needed a strategy for testing React components. Options considered:

- **Enzyme / shallow rendering**: Tests component internals (state, instance methods). Tightly couples tests to implementation. Not maintained for React 19.
- **React Test Utils**: Low-level, verbose, no ergonomic query API.
- **@testing-library/react**: Tests components the way users interact with them. Queries by role, text, label. Discourages testing implementation details.

The goal was characterization tests that survive refactoring. Tests that break when internal structure changes (but behavior stays the same) defeat the safety net purpose.

## Decision

Use **@testing-library/react** with **@testing-library/jest-dom** matchers.

- Query components by visible text, roles, and labels, not by class names or component internals.
- Use `render()` + `screen` queries as the primary test pattern.
- Use `jest-dom` matchers (`toBeInTheDocument`, `toHaveTextContent`) for readable assertions.

## Consequences

### Positive

- Tests survive refactoring: renaming internal state, changing component hierarchy, or extracting sub-components does not break tests.
- Encourages accessible markup: if a component is hard to test with Testing Library, it is likely hard to use with assistive technology.
- Large community, well-documented patterns.

### Negative

- Cannot test component internal state directly. Some edge cases require indirect verification through rendered output.
- Async behavior (timers, effects) requires `waitFor` / `act` wrappers that add complexity.
- Testing Library opinionates against certain query patterns (by class, by test-id), which may feel restrictive.
