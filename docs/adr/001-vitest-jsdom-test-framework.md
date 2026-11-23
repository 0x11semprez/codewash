# ADR-001: Vitest + jsdom as Test Framework

## Status

Accepted

## Date

2026-11-23

## Context

The project had zero tests. Before any refactoring, we needed a test framework to build a safety net. Options considered:

- **Jest**: Industry standard, large ecosystem, but requires separate configuration with Vite projects (babel transforms, module resolution mismatches).
- **Vitest**: Native Vite integration, same config file, ESM-first, compatible with Jest API surface.
- **Cypress/Playwright**: E2E testing tools, too heavy for unit/component-level characterization tests.

The project uses Vite as its bundler with React 19 and ESM modules throughout.

## Decision

Use **Vitest** with **jsdom** environment for all unit and component tests.

- Vitest shares Vite's transform pipeline, so imports, JSX, and path resolution work identically to the dev server.
- jsdom provides a lightweight DOM for component rendering without a real browser.
- v8 coverage provider for fast, accurate coverage reports.

## Consequences

### Positive

- Zero configuration friction: `vitest.config.js` extends `vite.config.js` patterns.
- Same module resolution as the app: no import path mismatches between test and production code.
- Fast execution: HMR-aware test runner, native ESM.
- Jest-compatible API: low learning curve, `describe`/`it`/`expect` work as expected.

### Negative

- jsdom does not support all browser APIs (Web Audio, Canvas). Tests requiring these need mocks.
- Vitest ecosystem is younger than Jest: fewer third-party plugins.
- Team members familiar only with Jest need to learn Vitest-specific configuration (though the test API is identical).
