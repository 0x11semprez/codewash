import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    MAX_TRACKED_ERRORS,
    clearTrackedErrors,
    getTrackedErrors,
    installErrorTracking,
    trackError,
} from '../services/errorTracker';
import { STORAGE_KEYS } from '../services/storageKeys';
import { createMemoryStorage } from './helpers/memoryStorage';

const FIXED_TIME = Date.UTC(2026, 10, 26, 12, 0, 0);
const clock = () => FIXED_TIME;

beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('trackError', () => {
    it('saves the source, the message, the stack and the time', () => {
        const error = new Error('boom');
        error.stack = 'Error: boom\n    at render (App.jsx:10:5)';
        trackError({ source: 'react', error, clock });
        expect(getTrackedErrors()).toEqual([
            {
                time: '2026-11-26T12:00:00.000Z',
                source: 'react',
                message: 'boom',
                stack: error.stack,
                count: 1,
            },
        ]);
    });

    it('keeps the error across a reload by saving it in localStorage', () => {
        trackError({ source: 'window', error: new Error('boom'), clock });
        const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.errorLog));
        expect(raw).toHaveLength(1);
        expect(raw[0].message).toBe('boom');
    });

    it('accepts values that are not Error objects', () => {
        trackError({ source: 'promise', error: 'plain text', clock });
        trackError({ source: 'promise', error: null, clock });
        expect(getTrackedErrors().map((entry) => [entry.message, entry.stack])).toEqual([
            ['plain text', ''],
            ['null', ''],
        ]);
    });

    it('adds the component stack when React gives one', () => {
        trackError({ source: 'react', error: new Error('boom'), componentStack: '\n    at Broken', clock });
        expect(getTrackedErrors()[0].componentStack).toBe('\n    at Broken');
    });

    it('counts a repeated error once instead of filling the list', () => {
        trackError({ source: 'react', error: new Error('boom'), clock });
        trackError({ source: 'react', error: new Error('boom'), clock: () => FIXED_TIME + 1000 });
        const list = getTrackedErrors();
        expect(list).toHaveLength(1);
        expect(list[0].count).toBe(2);
        expect(list[0].time).toBe('2026-11-26T12:00:01.000Z');
    });

    it('does not merge errors from different sources or with different messages', () => {
        trackError({ source: 'react', error: new Error('boom'), clock });
        trackError({ source: 'window', error: new Error('boom'), clock });
        trackError({ source: 'window', error: new Error('other'), clock });
        expect(getTrackedErrors()).toHaveLength(3);
    });

    it('keeps only the most recent errors', () => {
        for (let i = 0; i < MAX_TRACKED_ERRORS + 5; i += 1) {
            trackError({ source: 'window', error: new Error(`error ${i}`), clock });
        }
        const list = getTrackedErrors();
        expect(list).toHaveLength(MAX_TRACKED_ERRORS);
        expect(list[0].message).toBe('error 5');
        expect(list.at(-1).message).toBe(`error ${MAX_TRACKED_ERRORS + 4}`);
    });

    it('hides emails and credentials, and cuts very long text', () => {
        const error = new Error(`player kid@example.com token=abc123 ${'x'.repeat(5000)}`);
        error.stack = `Error: password=hunter2\n${'y'.repeat(5000)}`;
        trackError({ source: 'window', error, componentStack: `at kid@example.com ${'z'.repeat(5000)}`, clock });
        const [entry] = getTrackedErrors();
        expect(entry.message).toContain('[email]');
        expect(entry.message).toContain('token=[redacted]');
        expect(entry.message).not.toContain('abc123');
        expect(entry.stack).toContain('password=[redacted]');
        expect(entry.message.length).toBeLessThanOrEqual(500);
        expect(entry.stack.length).toBeLessThanOrEqual(2000);
        expect(entry.componentStack).toContain('[email]');
        expect(entry.componentStack.length).toBeLessThanOrEqual(2000);
    });

    it('never throws, even when the error object is broken', () => {
        const broken = {
            get message() {
                throw new Error('cannot read');
            },
        };
        expect(trackError({ source: 'window', error: broken, clock })).toBeNull();
        expect(getTrackedErrors()).toEqual([]);
    });

    it('never throws when localStorage is blocked', () => {
        vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() => trackError({ source: 'window', error: new Error('boom'), clock })).not.toThrow();
    });
});

describe('getTrackedErrors and clearTrackedErrors', () => {
    it('return an empty list when nothing was saved', () => {
        expect(getTrackedErrors()).toEqual([]);
    });

    it('ignore a corrupted save', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem(STORAGE_KEYS.errorLog, '{not json');
        expect(getTrackedErrors()).toEqual([]);
    });

    it('clear the saved errors', () => {
        trackError({ source: 'window', error: new Error('boom'), clock });
        clearTrackedErrors();
        expect(getTrackedErrors()).toEqual([]);
        expect(localStorage.getItem(STORAGE_KEYS.errorLog)).toBeNull();
    });

    it('survive a blocked localStorage when clearing', () => {
        vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(() => clearTrackedErrors()).not.toThrow();
    });
});

describe('installErrorTracking', () => {
    it('tracks an uncaught error and an unhandled promise rejection', () => {
        const target = new EventTarget();
        installErrorTracking({ target, clock });
        const uncaught = new Event('error');
        uncaught.error = new Error('uncaught');
        target.dispatchEvent(uncaught);
        const rejection = new Event('unhandledrejection');
        rejection.reason = new Error('rejected');
        target.dispatchEvent(rejection);
        expect(getTrackedErrors().map((entry) => [entry.source, entry.message])).toEqual([
            ['window', 'uncaught'],
            ['promise', 'rejected'],
        ]);
    });

    it('uses the event message when an error has no error object', () => {
        const target = new EventTarget();
        installErrorTracking({ target, clock });
        const script = new Event('error');
        script.message = 'Script error.';
        target.dispatchEvent(script);
        expect(getTrackedErrors()[0].message).toBe('Script error.');
    });

    it('stops tracking when the returned function is called', () => {
        const target = new EventTarget();
        const stop = installErrorTracking({ target, clock });
        stop();
        const uncaught = new Event('error');
        uncaught.error = new Error('uncaught');
        target.dispatchEvent(uncaught);
        expect(getTrackedErrors()).toEqual([]);
    });

    it('listens on window by default', () => {
        const stop = installErrorTracking();
        const uncaught = new Event('error');
        uncaught.error = new Error('from window');
        window.dispatchEvent(uncaught);
        stop();
        expect(getTrackedErrors()[0].message).toBe('from window');
    });
});
