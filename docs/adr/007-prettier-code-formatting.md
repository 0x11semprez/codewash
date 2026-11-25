# ADR-007: Prettier for code formatting

## Status

Accepted

## Date

2026-11-25

## Context

The subject asks for "lint and format checks" in the pipeline. ESLint covers lint, but nothing checked formatting. The code mixed styles: 4-space indents in most files, 2-space indents in some, a few tab-indented lines in `src/constants/gameData.jsx`, and both quote styles.

Without a formatter, every pull request can carry unrelated whitespace changes. Reviews get noisy, and merge conflicts are more frequent.

## Decision

Use Prettier 3, pinned to an exact version in `package.json`, and check `src/` only.

The settings in `.prettierrc.json` follow what most of the code already used, so the first formatting pass changes as few lines as possible:

| Setting | Value | Why |
| --- | --- | --- |
| `tabWidth` | 4 | About 1,970 lines started with 4 spaces, against about 420 with 2 |
| `singleQuote` | true | About 4,750 single quotes against about 1,250 double quotes |
| `semi` | true | Most statements already ended with a semicolon |
| `printWidth` | 120 | JSX lines with long Tailwind class lists would wrap a lot at the default 80 |

Commands:

- `npm run format` rewrites the files.
- `npm run format:check` fails if a file is not formatted. CI runs it on every pull request, right after lint.

The whole of `src/` was formatted in one commit that changes nothing else. That commit is listed in `.git-blame-ignore-revs`, so `git blame` skips it. To use it locally, run once:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

GitHub applies the file automatically in its blame view.

## Consequences

### Positive

- Formatting is no longer a review topic.
- Pull requests only show real changes.
- The format check closes one gap in the subject's CI requirements.

### Negative

- The formatting commit touches almost every file in `src/`. Open branches will conflict with it. To update a branch, merge `main`, then run `npm run format` and commit the result.
- Docs, config files and `electron/` are not checked. They can be added later by widening the path in the two scripts.
