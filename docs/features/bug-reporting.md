# Bug reporting

## Overview

The bug button in the bottom right corner opens a form. The player describes the problem and can add steps, an email, files and recent error logs. The report is then sent to the contact set at build time. The design is explained in [ADR-009](../adr/009-bug-reporting.md).

## Configure the contact

Copy `.env.example` to `.env.local` and set one or both values:

```
VITE_BUG_REPORT_ENDPOINT=https://example.com/bug-reports
VITE_BUG_REPORT_EMAIL=support@example.com
```

Vite reads these at build time. Restart `npm run dev` or run `npm run build` again after a change.

The game picks the delivery method like this:

| Endpoint set | Email set | What happens on Send |
| --- | --- | --- |
| yes | any | The report is posted to the endpoint, with files. |
| no | yes | The mail app opens with a prefilled email to that address. |
| no | no | The mail app opens with no recipient. The player types one. |

A value that is not a valid http(s) URL or email is ignored.

## The HTTP endpoint

The game sends a `POST` with `multipart/form-data`:

- `report`: a JSON file named `report.json` with the report below.
- `attachments`: one part per attached file. This part is absent when there are no files.

Any 2xx status counts as success. Any other status shows an error in the form. The request gives up after 15 seconds. If the endpoint is on another origin, it must allow CORS for the game's origin.

## What is sent

```json
{
  "createdAt": "2026-11-25T12:00:00.000Z",
  "description": "The boss never dies",
  "steps": "1. Start a math battle",
  "reporterEmail": "parent@example.com",
  "appVersion": "0.0.0",
  "environment": { "userAgent": "...", "language": "en-US", "screen": "1280x720" },
  "context": { "profileId": 1, "theme": "minecraft" },
  "logs": [{ "time": "...", "level": "error", "message": "..." }],
  "attachments": [{ "name": "shot.png", "type": "image/png", "size": 20480 }]
}
```

The `logs` list is empty when the player unchecks "Include recent error logs".

## Attachments

The player can attach up to 3 files of 5 MB each. Images, `.txt`, `.log` and `.json` files are accepted. Other files are refused with a message.

A mailto link cannot carry files. In that case the form tells the player to add the files to the email by hand. The JSON button saves the full report as a file, which can be attached the same way. The email body is cut at 1800 characters, because some mail apps drop long links.

## Privacy

- Nothing is sent until the player presses Send.
- Logs stay in memory only. They are lost when the game closes.
- Only `console.warn`, `console.error`, uncaught errors and unhandled promise rejections are kept. At most 50 entries, 500 characters each.
- Email addresses in logs become `[email]`. Values after words like `token`, `password`, `secret` or `api_key` become `[redacted]`.
- The player sees a preview of the logs and can leave them out.
- The reporter email is optional. It is only used to reply.
- Save data, profile names and achievements are not sent. Only the profile number and theme name are.

## Electron

In the portable app, the `mailto:` link is passed to the system mail app through `shell.openExternal`. The game window stays where it is.

## How to test

Automated tests:

```
npx vitest run --dir src bugReport BugReportModal
```

- `src/__tests__/bugReport.test.js` covers the config, file checks, log buffer, report builder and both transports. It uses a fake `fetch`, a fake URL opener and a fixed clock.
- `src/__tests__/components/BugReportModal.test.jsx` covers the form: validation, a successful send with a fake transport, the error state, file removal, the log checkbox and the JSON download.

Manual check without a server:

1. Leave both env values empty and run `npm run dev`.
2. Click the bug button, type a description and press Send.
3. Your mail app should open with the report in the body.

Manual check with a server:

1. Start a small local server on port 8787 that logs each request and sends `Access-Control-Allow-Origin: *`.
2. Set `VITE_BUG_REPORT_ENDPOINT=http://localhost:8787` in `.env.local` and restart `npm run dev`.
3. Send a report with a screenshot. The server should receive a `report` part and an `attachments` part.
4. Stop the server and send again. The form should show "Sending failed."
