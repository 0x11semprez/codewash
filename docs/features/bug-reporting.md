# Bug reporting

> Mission issue: [#19](https://github.com/0x11semprez/codewash/issues/19) | Implementation: [#77](https://github.com/0x11semprez/codewash/pull/77) | Design: [ADR-009](../adr/009-bug-reporting.md)

Players can report bugs from inside the game without leaving it. A floating button in the bottom right opens a form where they describe the problem, attach files and optionally include recent error logs. The report reaches the team through whichever channel was configured at build time.

## How the report travels

```mermaid
flowchart LR
    A[Player clicks bug button] --> B[Fills the form]
    B --> C{Endpoint set?}
    C -- Yes --> D[POST multipart/form-data]
    D --> E[Backend receives report + files]
    C -- No --> F{Email set?}
    F -- Yes --> G[mailto: with prefilled body]
    F -- No --> H[mailto: blank recipient]
    G --> I[Mail app opens]
    H --> I
```

## Configure the contact

Copy `.env.example` to `.env.local` and set one or both values:

```
VITE_BUG_REPORT_ENDPOINT=https://example.com/bug-reports
VITE_BUG_REPORT_EMAIL=support@example.com
```

Vite reads these at build time. Restart `npm run dev` or rebuild after a change.

| Endpoint set | Email set | What happens on Send |
| --- | --- | --- |
| yes | any | Report posted to endpoint, with files |
| no | yes | Mail app opens with prefilled email |
| no | no | Mail app opens, player types recipient |

Invalid URLs or emails are silently ignored.

## What gets sent

The endpoint receives a `POST` with `multipart/form-data`. The `report` part is a JSON file that looks like this:

```json
{
  "createdAt": "2026-11-25T12:00:00.000Z",
  "description": "The boss never dies",
  "steps": "1. Start a math battle",
  "reporterEmail": "parent@example.com",
  "appVersion": "0.0.0",
  "environment": { "userAgent": "...", "language": "en-US", "screen": "1280x720" },
  "context": { "profileId": 1, "theme": "blocks" },
  "logs": [{ "time": "...", "level": "error", "message": "..." }],
  "attachments": [{ "name": "shot.png", "type": "image/png", "size": 20480 }]
}
```

The `attachments` part carries the actual files. Any 2xx counts as success. The request gives up after 15 seconds. If the endpoint is on another origin, it must allow CORS for the game's origin.

## Attachments

Up to 3 files, 5 MB each. Accepted: images, `.txt`, `.log`, `.json`.

A `mailto:` link cannot carry files. When using email, the form tells the player to attach files by hand. A "Save as JSON" button exports the full report as a downloadable file. Email body is capped at 1800 characters for mail-app compatibility.

## Privacy

Nothing leaves the game until the player presses Send. The report includes only what the player chose to share.

Logs stay in memory and are lost when the game closes. Only `console.warn`, `console.error`, uncaught errors and unhandled promise rejections are kept — at most 50 entries, 500 characters each. Email addresses in the logs are replaced with `[email]`, and values after words like `token`, `password` or `secret` become `[redacted]`. The player sees a preview of the logs and can uncheck the box to leave them out.

The reporter email is optional and only used to reply. Save data, profile names and achievements are never included — the report only carries the profile number and the theme name.

## Electron

In the portable app, the `mailto:` link goes through `shell.openExternal` to the system mail client.

## Tests

```
npx vitest run --dir src bugReport BugReportModal
```

| Test file | Coverage |
| --- | --- |
| `src/__tests__/bugReport.test.js` | Config, file checks, log buffer, report builder, both transports |
| `src/__tests__/components/BugReportModal.test.jsx` | Form validation, send flow, error state, file removal, log checkbox, JSON download |

**Manual check without a server:** leave both env values empty, `npm run dev`, click bug button, send. Mail app opens with report in body.

**Manual check with a server:** start a local server on port 8787 with `Access-Control-Allow-Origin: *`, set `VITE_BUG_REPORT_ENDPOINT=http://localhost:8787`, restart dev, send with a screenshot. Server receives `report` + `attachments` parts. Stop server, send again: form shows "Sending failed."
