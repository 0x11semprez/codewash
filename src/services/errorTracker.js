// Keeps the last errors of the game in localStorage, so they survive a crash and a reload.
// Nothing is sent anywhere: the game has no server. A developer reads them from the browser.
import { now } from '../utils/clock.js';
import { redact } from '../utils/bugReport/logBuffer.js';
import { readJSON, writeJSON } from './storage.js';
import { STORAGE_KEYS } from './storageKeys.js';

export const MAX_TRACKED_ERRORS = 20;
export const MAX_MESSAGE_LENGTH = 500;
export const MAX_STACK_LENGTH = 2000;

const clean = (text, max) => redact(String(text)).slice(0, max);

export const getTrackedErrors = () => readJSON(STORAGE_KEYS.errorLog, []);

export const clearTrackedErrors = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.errorLog);
    } catch (error) {
        console.warn('[errorTracker] Cannot clear the saved errors:', error);
    }
};

// Saves one error. An error identical to the previous one only raises its count.
// This function never throws: tracking an error must not cause another one.
export const trackError = ({ source, error, componentStack, clock = now }) => {
    try {
        const entry = {
            time: new Date(clock()).toISOString(),
            source,
            message: clean(error?.message ?? error, MAX_MESSAGE_LENGTH),
            stack: clean(error?.stack ?? '', MAX_STACK_LENGTH),
            count: 1,
        };
        if (componentStack) entry.componentStack = clean(componentStack, MAX_STACK_LENGTH);

        const list = getTrackedErrors();
        const last = list.at(-1);
        if (last && last.source === entry.source && last.message === entry.message) {
            last.count += 1;
            last.time = entry.time;
        } else {
            list.push(entry);
        }
        writeJSON(STORAGE_KEYS.errorLog, list.slice(-MAX_TRACKED_ERRORS));
        return entry;
    } catch {
        return null;
    }
};

// Tracks uncaught errors and unhandled promise rejections. Returns a function that stops it.
export const installErrorTracking = ({ target = window, clock = now } = {}) => {
    const onError = (event) => trackError({ source: 'window', error: event.error ?? event.message, clock });
    const onRejection = (event) => trackError({ source: 'promise', error: event.reason, clock });
    target.addEventListener('error', onError);
    target.addEventListener('unhandledrejection', onRejection);
    return () => {
        target.removeEventListener('error', onError);
        target.removeEventListener('unhandledrejection', onRejection);
    };
};
