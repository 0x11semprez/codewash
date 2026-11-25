// Small helpers around the system clock.
// Code that needs the time takes a `now` function, so tests can pass a fixed time.

// Current time in milliseconds since the epoch.
export const now = () => Date.now();

// Calendar day (UTC) for a time in milliseconds, as 'YYYY-MM-DD'.
export const toDateKey = (ms) => new Date(ms).toISOString().split('T')[0];

// Today's calendar day (UTC), as 'YYYY-MM-DD'.
export const today = (clock = now) => toDateKey(clock());
