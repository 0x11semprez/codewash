# Level Up RPG

Educational RPG game built with React 19, Vite, and Tailwind CSS. Players level up skills (math, reading, writing, patterns) by defeating mobs through correctly answering educational challenges.

## Prerequisites

- Node.js 20+
- npm 10+

## Install

```bash
npm install --legacy-peer-deps
```

## Run

```bash
# Web development server
npm run dev

# Electron desktop app
npm run electron:dev

# Production build
npm run build
```

## Test

```bash
# Run all tests
npm run test

# Run tests with coverage report
npm run test:coverage
```

## Lint

```bash
npm run lint
```

## Project Structure

```
src/
  components/       # React UI components
    ui/             # Reusable UI primitives (SafeImage, PixelHeart, MobWithAura)
    modals/         # Modal dialogs (BugReport, Reset)
  utils/            # Game logic utilities
    gameUtils.js    # RPG progression, encounters, math/reading/writing generation
    achievementUtils.js  # Achievement unlock checks, tier progression
    mobDisplayUtils.js   # Mob aura system
    soundManager.js      # BGM/SFX audio manager
  constants/        # Game data and configuration
    gameData.jsx    # Mobs, items, difficulty tiers, themes
    achievements.js # Achievement definitions and tiers
  __tests__/        # Test suites (136 tests)
docs/
  adr/              # Architecture Decision Records
  DEBT.md           # Technical debt register
```

## Performance

Work tracked in issue #12. Full details, figures and open items are in [Performances.md](Performances.md).

### Loading screen

A full-screen loader shows a progress percentage while the theme background, logo, card back, skill icons and visible mob sprites are preloaded, then fades into the game. A failed critical image offers a **Continue** action. The measured load time unlocks the `So... So fast !?` achievement. UI sounds are warmed in the background; background music is not preloaded.

### Performance profiling

React DevTools Profiler captures showed closed drawers re-rendering on every update (8 of 10 commits). After the changes they no longer render, and the maximum commit time went from 277.2 ms to 142.3 ms (development build, not input latency). A first FCP baseline of 522.9 ms was recorded on the production preview; Time to Interactive is still to be measured.

### Optimizations

- `React.memo` on `SafeImage`, `PixelHeart`, `MobWithAura` and the three drawers
- `React.lazy` + `Suspense` for drawers and modals, mounted on first use
- Global CSS extracted to `GlobalStyles.css` and loaded under the loading screen
- Off-screen images loaded lazily, `useMemo` on carousel items

## CI Pipeline

GitHub Actions runs on every PR and push to `main`:

1. Lint (ESLint)
2. Build (Vite)
3. Test (Vitest)
4. Coverage check (thresholds enforced)

## Architecture Decisions

See [docs/adr/](docs/adr/) for recorded decisions.

## Tech Stack

- **Runtime**: React 19 + Vite (rolldown)
- **Styling**: Tailwind CSS 4
- **Desktop**: Electron
- **Testing**: Vitest + jsdom + @testing-library/react
- **CI**: GitHub Actions
- **Coverage**: v8 provider, thresholds: 30% lines, 20% functions/branches
