# Level Up RPG

Level Up RPG is an educational game for children. The player trains skills (math, reading, writing, patterns, memory, cleaning) by answering short challenges. Each right answer damages a mob and earns XP.

The game was first written by a non-developer with AI tools. This repository is the Epitech CodeWash project: we test, clean and document it without breaking what already works.

## Quick start

You need Node.js 20 or later and npm 10 or later.

```bash
npm install --legacy-peer-deps   # install dependencies
npm run dev                      # start the game at http://localhost:5173
npm test                         # run all tests
```

`--legacy-peer-deps` is required: without it, npm refuses to install because of a peer dependency conflict.

## Other commands

| Command | What it does |
| --- | --- |
| `npm run build` | Build the web version into `dist/` |
| `npm run preview` | Serve the built version at http://localhost:4173 |
| `npm run electron:dev` | Build, then open the game in an Electron window |
| `npm run electron:build` | Package the desktop app with electron-builder |
| `npm run test:coverage` | Run the tests and write a coverage report to `coverage/` |
| `npm run lint` | Run ESLint on `src/` |

To run the game in Docker (nginx on port 80 inside the container):

```bash
docker build -t codewash .
docker run --rm -p 8080:80 codewash   # open http://localhost:8080
```

The Docker build is broken right now: the `Dockerfile` runs `npm ci` without `--legacy-peer-deps`. See [DEBT-022](https://github.com/0x11semprez/codewash/issues/54).

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
  utils/             Pure game logic, sound manager, asset preloading
  constants/         Game data: mobs, themes, skills, achievements
  themes/            One JSON file per theme (see docs/features/themes.md)
  __tests__/         Vitest test suites
docs/                Project documentation (see below)
electron/            Electron main process
public/assets/       Images, sounds and music
```

## Documentation

Start with [docs/SUBJECT_MAP.md](docs/SUBJECT_MAP.md). It lists every requirement of the CodeWash subject and the file or pull request that answers it.

| Topic | Where |
| --- | --- |
| Technical debt register: codebase map, debt items, metrics, risk matrix, plan | [docs/DEBT.md](docs/DEBT.md) |
| Why the architecture is the way it is | [docs/adr/](docs/adr/) |
| Branches, CI and team workflow | [docs/handover/development-plan.md](docs/handover/development-plan.md) |
| Performance mission: loading screen, profiling, measurements | [docs/missions/performance.md](docs/missions/performance.md) |
| Microphone and speech recognition | [docs/features/microphone.md](docs/features/microphone.md) |
| Themes: how to add a theme, audit, credits | [docs/features/themes.md](docs/features/themes.md) |
| What to do when something breaks | [docs/handover/RUNBOOK.md](docs/handover/RUNBOOK.md) |
| What changed since the received version | [CHANGELOG.md](CHANGELOG.md) |

## Continuous integration

GitHub Actions runs on every pull request to `main` and on every push to `main`. It installs dependencies, runs ESLint with zero warnings allowed, builds the app, runs the tests and checks coverage. The team rule is to never merge on red. GitHub enforces it: `main` is protected, so a pull request with a green `build-and-test` check is needed to merge.

Coverage thresholds live in `vitest.config.js`: 60% of lines and statements, 50% of branches and 40% of functions. The subject asks for 80% on modified code. Raising the thresholds is tracked in [#17](https://github.com/0x11semprez/codewash/issues/17).

## Tech stack

React 19, Vite (rolldown), Tailwind CSS 4, Electron, Vitest with jsdom and Testing Library, ESLint, Docker with nginx, GitHub Actions.
