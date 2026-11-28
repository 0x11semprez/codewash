# Level Up RPG

Level Up RPG is an educational game for children. The player trains skills (math, reading, writing, patterns, memory, cleaning) by answering short challenges. Each right answer damages a mob and earns XP.

The game was first written by a non-developer with AI tools. This repository is the Epitech CodeWash project: we test, clean and document it without breaking what already works.

## Quick start

You need Node.js 20 or later and npm 10 or later.

```bash
npm install                      # install dependencies
npm run dev                      # start the game at http://localhost:5173
npm test                         # run all tests
```

## Other commands

| Command | What it does |
| --- | --- |
| `npm run build` | Build the web version into `dist/` |
| `npm run preview` | Serve the built version at http://localhost:4173 |
| `npm run electron:dev` | Build, then open the game in an Electron window |
| `npm run electron:build` | Package the desktop app with electron-builder |
| `npm run test:coverage` | Run the tests and write a coverage report to `coverage/` |
| `npm run lint` | Run ESLint on `src/` |
| `npm run metrics` | Measure size, complexity, duplication, dead files and coverage (see [docs/DEBT.md section 8](docs/DEBT.md#8-final-metrics)) |

To run the game in Docker (nginx on port 80 inside the container):

```bash
docker build -t codewash .
docker run --rm -p 8080:80 codewash   # open http://localhost:8080
```

CI builds this image on every pull request, so a broken `Dockerfile` fails the checks.

## Project structure

```
src/
  App.jsx            Main screen: wires the hooks to the components
  main.jsx           Entry point: error boundary, loading gate, web vitals
  hooks/             Game state and logic (battle, carousel, voice, audio, fullscreen, save data)
  components/
    skills/          SkillCard and one component per mini-game in games/
    drawers/         Menu, settings and cosmetics side panels
    modals/          Reset and bug report dialogs
    profile/         Player profile card
    ui/              Shared pieces: loading screen, error boundaries, images, toasts
  services/          Browser I/O: storage, storage keys, sound manager, error tracking
  utils/             Pure game logic, asset preloading, bug report helpers
  i18n/              Translation provider and one file per language in locales/
  constants/         Game data: mobs, themes, skills, achievements
  themes/            One JSON file per theme (see docs/features/themes.md)
  __tests__/         Vitest test suites
docs/                Project documentation (see below)
electron/            Electron main process
tools/               Measurement scripts (metrics, animations)
public/assets/       Images, sounds and music
```

## Documentation

Start with [docs/SUBJECT_MAP.md](docs/SUBJECT_MAP.md). It lists every requirement of the CodeWash subject and the file or pull request that answers it.

| Topic | Where |
| --- | --- |
| How the system works today: module graph, state, I/O, main flows | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Technical debt register: received version, debt items, before and after metrics, risk matrix, plan, residual debt | [docs/DEBT.md](docs/DEBT.md) |
| Why the architecture is the way it is | [docs/adr/](docs/adr/) |
| Branches, CI and team workflow | [docs/handover/development-plan.md](docs/handover/development-plan.md) |
| Performance mission: loading screen, profiling, measurements | [docs/missions/performance.md](docs/missions/performance.md) |
| Microphone and speech recognition | [docs/features/microphone.md](docs/features/microphone.md) |
| Themes: how to add a theme, audit, credits | [docs/features/themes.md](docs/features/themes.md) |
| What to do when something breaks | [docs/handover/RUNBOOK.md](docs/handover/RUNBOOK.md) |
| How to work on this project day-to-day | [docs/handover/PLAYBOOK.md](docs/handover/PLAYBOOK.md) |
| What changed since the received version | [CHANGELOG.md](CHANGELOG.md) |

## Continuous integration

GitHub Actions runs on every pull request to `main` and on every push to `main`. It installs dependencies, runs ESLint with zero warnings allowed, checks the format, builds the app, runs the tests, checks coverage and builds the Docker image. ESLint also has complexity ceilings: no function may get more complex than the worst one today ([ADR-014](docs/adr/014-codeql-static-analysis.md)). The team rule is to never merge on red. GitHub enforces it: `main` is protected, so a pull request with a green `build-and-test` check is needed to merge.

A second workflow, `.github/workflows/codeql.yml`, runs CodeQL static analysis on `src/` and `electron/` with the `security-and-quality` queries. It runs on the same pull requests and pushes, and once a week. Alerts are in the Security tab under Code scanning. The runbook explains what to do when CodeQL fails.

Coverage thresholds live in `vitest.config.js`. They are 100% for lines, statements, branches and functions, so any new code without tests fails CI. Two files are left out of the count: `src/main.jsx`, which only starts React, and `src/constants/assets.js`, a list of placeholder paths that nothing imports.

## Tech stack

React 19, Vite (rolldown), Tailwind CSS 4, Electron, Vitest with jsdom and Testing Library, ESLint, Docker with nginx, GitHub Actions.
