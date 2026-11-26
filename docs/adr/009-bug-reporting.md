# ADR-009: Bug reporting

## Status

Accepted

## Date

2026-11-25

## Context

The bug button in the bottom right corner opened a placeholder modal. It said "Whoa... That sucks..." and did nothing else. Players had no way to tell us about a problem.

The subject asks for three things. The contact destination must be configurable. The player must be able to attach screenshots, files and logs. Delivery must be testable.

The game runs as a static web build and as a portable Electron app. There is no backend in this repository. Any solution must work with no server, and use one when it exists.

## Decision

We split the feature into small modules under `src/utils/bugReport/`. The modal only wires them together.

- `config.js` reads `VITE_BUG_REPORT_ENDPOINT` and `VITE_BUG_REPORT_EMAIL` from the Vite env. Values that are not an http(s) URL or an email are ignored. The default is no endpoint and no email.
- `logBuffer.js` keeps the last 50 console warnings and errors in memory. It also records uncaught errors and unhandled promise rejections. Each message is cut to 500 characters. Email addresses and values that look like tokens or passwords are replaced before they are stored. `main.jsx` installs it once at startup. The original console methods still run.
- `attachments.js` checks files. It accepts images, `.txt`, `.log` and `.json`, up to 3 files of 5 MB each.
- `buildReport.js` is a pure function. It takes the form fields, context, logs, file list, environment and a clock, and returns plain data. The clock is injected as in ADR-008, so tests get a fixed date.
- `transports.js` has two transports with the same shape: `send(report, files)`.
  - The HTTP transport posts `multipart/form-data`. The `report` part is JSON and each file is an `attachments` part. A non-2xx status is an error. The request times out after 15 seconds.
  - The mailto transport opens the mail app with a prefilled subject and body. A mailto link cannot carry files, so the modal says so, and the body is cut at 1800 characters.
  - `createTransport(config)` picks HTTP when an endpoint is set, and mailto otherwise.
  - `downloadReportJson` saves the full report as a file. The player can attach it to the email by hand.

The modal takes `transport`, `config`, `logBuffer` and `download` as optional props. Tests pass fakes. The app passes nothing and gets the real ones. `App.jsx` passes the current profile id and theme as context.

`send` takes the files as a second argument. The report itself stays plain JSON, so the same object works for the JSON download and the email body.

In Electron, navigating to a `mailto:` link would do nothing useful. `electron/main.cjs` now catches `will-navigate` for `mailto:` URLs and hands them to `shell.openExternal`.

We did not add a dependency. `fetch`, `FormData` and `Blob` cover everything. We rejected a third-party error tracker such as Sentry. It needs an account and a DSN, sends data on its own, and is too heavy for a children's game with no backend.

## Consequences

### Positive

- The feature works with no server at all, through the mail app or the JSON download.
- Pointing the game at a real endpoint is a one-line env change.
- Every piece is tested with fakes. Tests use no real network and no real mail app, and the date is fixed.
- The new code lives in the lazy `BugReportModal` chunk, except the small log buffer in the main bundle.

### Negative

- With mailto, files are not sent. The player must attach them by hand.
- The endpoint and email are baked in at build time. Changing them means a new build.
- The redaction is a simple pattern match. It can miss a secret written in an unusual format.
- The log buffer only sees what goes through `console.warn`, `console.error` and window error events. `console.log` and `console.info` are not captured.
- There is no server in this repository to receive the HTTP reports. Whoever sets the endpoint must provide one.
