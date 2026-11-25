# ADR-008: Inject randomness and the clock

## Status

Accepted

## Date

2026-11-25

## Context

Game logic called `Math.random`, `Date.now` and `new Date` directly. There were 36 such calls in 8 files under `src/`. Most of them were in pure utility code: mob picks, aura picks, word picks and math problems.

A test cannot control a direct call. The existing characterization tests could only loop many times and check that the result looked valid. They could not ask for the first or last item of a pool, or for the lowest and highest numbers in a math problem. One known bug lives in exactly that corner: at difficulty 3 and up, a subtraction can give `0 - 1 = -1`. A random loop finds it only by luck.

The subject's protocol asks us to separate the domain from I/O and to inject the clock and config. Randomness and time are both I/O for this purpose.

## Decision

Pass the random source and the clock in as arguments, with the real ones as defaults.

- `src/utils/random.js` holds three small helpers: `randomInt`, `randomIntBetween` and `pickRandom`. Each takes the random source as its last argument, and it defaults to `Math.random`.
- `src/utils/clock.js` holds `now()`, `toDateKey(ms)` and `today(clock)`. `today` takes the clock as an argument, and it defaults to `now`.
- Every function in `src/utils/gameUtils.js` and `src/utils/mobDisplayUtils.js` that uses randomness takes an optional last parameter `random = Math.random`. Existing callers pass nothing, so their behavior does not change. Each helper calls the source the same number of times, in the same order, as the old code.
- `useGameState` takes an optional `{ now }` option for the daily login date. `App` still calls `useGameState()` with no argument.

Tests pass a fixed source such as `() => 0`, `() => 0.999999`, or a short sequence of values. This makes each pick predictable. The known subtraction bug is now pinned by a test that names it. It is not fixed here, because this change must keep behavior the same.

We rejected `vi.useFakeTimers` and `vi.spyOn(Math, 'random')`. They patch globals for the whole test file. Every call in the code under test sees the fake, including calls in React and the test library. A spied `Math.random` must also be fed values in the exact order that hidden calls use it, so the test breaks when unrelated code adds a call. They also only work inside Vitest, so the code itself stays hard to reuse. An argument is local, visible in the signature, and works with any test runner.

## Consequences

### Positive

- Edge cases are tested on purpose: first and last pick, lowest and highest numbers, and the `-1` subtraction bug.
- Tests no longer need loops of 50 or 100 runs to get coverage of random code.
- Public signatures stay compatible. No caller had to change.

### Negative

- Some functions now have one more parameter. A caller that passes a function by reference, like `items.map(getRandomAura)`, would send the index as the random source. No caller does this today. Call these functions with an arrow function.
- The refactor covers the pure utilities and the login date only. These calls remain and still use the globals directly:
  - `src/hooks/useBattle.js`: damage popup position.
  - `src/utils/soundManager.js`: random sound pick.
  - `src/components/PhantomEvent.jsx`: spawn delay, side and cooldown time.
  - `src/components/skills/games/MemoryGame.jsx`: deck shuffle.
  - `src/components/skills/games/PatternGame.jsx`: color sequence.

  They can follow the same pattern later. The shuffle in `MemoryGame.jsx` uses `sort(() => Math.random() - 0.5)`, which is biased. That is a separate fix.
