// Keeps the last few console warnings and errors in memory, so a bug report can include them.
// Nothing is stored on disk or sent anywhere until the player sends a report.
import { now } from '../clock.js';

export const MAX_LOG_ENTRIES = 50;
export const MAX_MESSAGE_LENGTH = 500;

const SECRET_PATTERN = /\b(token|api[_-]?key|password|secret|authorization)(["']?\s*[:=]\s*["']?)[^\s"',&]+/gi;
const EMAIL_PATTERN = /[^\s@"'<>]+@[^\s@"'<>]+\.[^\s@"'<>]+/g;

// Hides email addresses and values that look like credentials.
export const redact = (text) => text.replace(SECRET_PATTERN, '$1$2[redacted]').replace(EMAIL_PATTERN, '[email]');

const formatPart = (part) => {
    if (part instanceof Error) return part.stack || `${part.name}: ${part.message}`;
    if (typeof part === 'string') return part;
    try {
        return JSON.stringify(part) ?? String(part);
    } catch {
        return String(part);
    }
};

export const createLogBuffer = ({ max = MAX_LOG_ENTRIES, clock = now } = {}) => {
    let entries = [];
    return {
        add(level, parts) {
            const message = redact(parts.map(formatPart).join(' ')).slice(0, MAX_MESSAGE_LENGTH);
            entries.push({ time: new Date(clock()).toISOString(), level, message });
            if (entries.length > max) entries = entries.slice(-max);
        },
        getEntries: () => [...entries],
        clear() {
            entries = [];
        },
    };
};

// Shared buffer for the whole app.
export const appLogBuffer = createLogBuffer();

// Wraps console.warn and console.error and listens for uncaught errors.
// The original console methods still run. Returns a function that undoes everything.
export const installLogCapture = ({ buffer = appLogBuffer, target = window, consoleObj = console } = {}) => {
    const originals = { warn: consoleObj.warn, error: consoleObj.error };
    for (const level of ['warn', 'error']) {
        consoleObj[level] = (...args) => {
            buffer.add(level, args);
            originals[level].apply(consoleObj, args);
        };
    }
    const onError = (event) => buffer.add('error', [event.error ?? event.message]);
    const onRejection = (event) => buffer.add('error', ['Unhandled rejection:', event.reason]);
    target.addEventListener('error', onError);
    target.addEventListener('unhandledrejection', onRejection);

    return () => {
        consoleObj.warn = originals.warn;
        consoleObj.error = originals.error;
        target.removeEventListener('error', onError);
        target.removeEventListener('unhandledrejection', onRejection);
    };
};
