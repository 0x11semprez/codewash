import { describe, it, expect, vi } from 'vitest';
import { readBugReportConfig, isValidEmail } from '../utils/bugReport/config.js';
import { addFiles, formatBytes, MAX_FILES, MAX_FILE_BYTES } from '../utils/bugReport/attachments.js';
import { createLogBuffer, installLogCapture, redact, MAX_MESSAGE_LENGTH } from '../utils/bugReport/logBuffer.js';
import { buildReport, formatReportText, readEnvironment } from '../utils/bugReport/buildReport.js';
import {
    buildMailtoUrl,
    createHttpTransport,
    createMailtoTransport,
    createTransport,
    downloadReportJson,
    MAX_MAILTO_BODY,
} from '../utils/bugReport/transports.js';

const FIXED_TIME = Date.UTC(2026, 10, 25, 12, 0, 0);
const clock = () => FIXED_TIME;
const environment = { userAgent: 'TestAgent/1.0', language: 'en-US', screen: '1280x720' };

const makeFile = (name, type, size = 10) => {
    const file = new File(['x'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
};

const readBlob = (blob) =>
    new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsText(blob);
    });

const makeReport = (overrides = {}) =>
    buildReport({ description: 'Boss heals forever', environment, appVersion: '1.2.3', clock, ...overrides });

describe('readBugReportConfig', () => {
    it('defaults to no endpoint and no email', () => {
        expect(readBugReportConfig({})).toEqual({ endpoint: '', email: '' });
    });

    it('reads a valid endpoint and email', () => {
        const env = {
            VITE_BUG_REPORT_ENDPOINT: ' https://example.test/bugs ',
            VITE_BUG_REPORT_EMAIL: 'dev@example.test',
        };
        expect(readBugReportConfig(env)).toEqual({ endpoint: 'https://example.test/bugs', email: 'dev@example.test' });
    });

    it('ignores values that are not an http URL or an email', () => {
        const env = { VITE_BUG_REPORT_ENDPOINT: 'javascript:alert(1)', VITE_BUG_REPORT_EMAIL: 'not-an-email' };
        expect(readBugReportConfig(env)).toEqual({ endpoint: '', email: '' });
        expect(readBugReportConfig({ VITE_BUG_REPORT_ENDPOINT: 'not a url' }).endpoint).toBe('');
    });

    it('reads the real Vite env without throwing', () => {
        expect(readBugReportConfig()).toHaveProperty('endpoint');
    });

    it('checks email shape', () => {
        expect(isValidEmail('a@b.co')).toBe(true);
        expect(isValidEmail('a@b')).toBe(false);
    });
});

describe('addFiles', () => {
    it('keeps images and text logs', () => {
        const result = addFiles([], [makeFile('shot.png', 'image/png'), makeFile('game.LOG', '')]);
        expect(result.files.map((f) => f.name)).toEqual(['shot.png', 'game.LOG']);
        expect(result.errors).toEqual([]);
    });

    it('rejects other types, big files and files over the count limit', () => {
        const current = Array.from({ length: MAX_FILES - 1 }, (_, i) => makeFile(`a${i}.png`, 'image/png'));
        const result = addFiles(current, [
            makeFile('virus.exe', 'application/octet-stream'),
            makeFile('huge.png', 'image/png', MAX_FILE_BYTES + 1),
            makeFile('ok.txt', 'text/plain'),
            makeFile('one-too-many.png', 'image/png'),
        ]);
        expect(result.files).toHaveLength(MAX_FILES);
        expect(result.errors).toHaveLength(3);
        expect(result.errors[0]).toMatch(/virus\.exe/);
        expect(result.errors[1]).toMatch(/huge\.png: larger than 5\.0 MB/);
        expect(result.errors[2]).toMatch(/up to 3 files/);
    });

    it('formats sizes', () => {
        expect(formatBytes(1500)).toBe('2 KB');
        expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
    });
});

describe('log buffer', () => {
    it('keeps only the most recent entries', () => {
        const buffer = createLogBuffer({ max: 3, clock });
        for (let i = 1; i <= 5; i += 1) buffer.add('warn', [`message ${i}`]);
        const entries = buffer.getEntries();
        expect(entries.map((e) => e.message)).toEqual(['message 3', 'message 4', 'message 5']);
        expect(entries[0]).toEqual({ time: '2026-11-25T12:00:00.000Z', level: 'warn', message: 'message 3' });
    });

    it('formats errors and objects, cuts long messages and clears', () => {
        const buffer = createLogBuffer({ clock });
        const error = new Error('boom');
        error.stack = 'Error: boom\n    at here';
        const circular = {};
        circular.self = circular;
        buffer.add('error', [error, { a: 1 }, circular, undefined]);
        buffer.add('error', ['x'.repeat(MAX_MESSAGE_LENGTH + 100)]);
        const [first, second] = buffer.getEntries();
        expect(first.message).toBe('Error: boom\n    at here {"a":1} [object Object] undefined');
        expect(second.message).toHaveLength(MAX_MESSAGE_LENGTH);
        buffer.clear();
        expect(buffer.getEntries()).toEqual([]);
    });

    it('formats an error without a stack as name and message', () => {
        const buffer = createLogBuffer({ clock });
        const error = new TypeError('bad value');
        error.stack = '';
        buffer.add('error', [error]);
        expect(buffer.getEntries()[0].message).toBe('TypeError: bad value');
    });

    it('redacts emails and secrets', () => {
        expect(redact('user kid@home.test token=abc123 password: "hunter2"')).toBe(
            'user [email] token=[redacted] password: "[redacted]"',
        );
    });

    it('captures console warn/error and window errors, then uninstalls', () => {
        const buffer = createLogBuffer({ clock });
        const original = { warn: vi.fn(), error: vi.fn(), info: vi.fn() };
        const consoleObj = { ...original };
        const target = new EventTarget();
        const uninstall = installLogCapture({ buffer, target, consoleObj });

        consoleObj.warn('careful');
        consoleObj.error('broken', 42);
        consoleObj.info('not captured');
        target.dispatchEvent(Object.assign(new Event('error'), { message: 'Script error.' }));
        target.dispatchEvent(Object.assign(new Event('unhandledrejection'), { reason: 'nope' }));

        expect(original.warn).toHaveBeenCalledWith('careful');
        expect(original.error).toHaveBeenCalledWith('broken', 42);
        expect(buffer.getEntries().map((e) => `${e.level}:${e.message}`)).toEqual([
            'warn:careful',
            'error:broken 42',
            'error:Script error.',
            'error:Unhandled rejection: nope',
        ]);

        uninstall();
        expect(consoleObj.warn).toBe(original.warn);
        expect(consoleObj.error).toBe(original.error);
        target.dispatchEvent(new Event('error'));
        expect(buffer.getEntries()).toHaveLength(4);
    });
});

describe('buildReport', () => {
    it('builds the full report with a fixed clock', () => {
        const report = buildReport({
            description: '  Boss heals forever ',
            steps: ' 1. fight boss ',
            reporterEmail: ' parent@example.test ',
            context: { profileId: 2, theme: 'minecraft' },
            logs: [{ time: 't', level: 'error', message: 'oops' }],
            files: [makeFile('shot.png', 'image/png', 2048)],
            environment,
            appVersion: '1.2.3',
            clock,
        });
        expect(report).toEqual({
            createdAt: '2026-11-25T12:00:00.000Z',
            description: 'Boss heals forever',
            steps: '1. fight boss',
            reporterEmail: 'parent@example.test',
            appVersion: '1.2.3',
            environment,
            context: { profileId: 2, theme: 'minecraft' },
            logs: [{ time: 't', level: 'error', message: 'oops' }],
            attachments: [{ name: 'shot.png', type: 'image/png', size: 2048 }],
        });
    });

    it('uses safe defaults', () => {
        const report = buildReport({ description: 'x' });
        expect(report.context).toEqual({ profileId: null, theme: null });
        expect(report.appVersion).toEqual(expect.any(String));
        expect(report.environment.userAgent).toEqual(expect.any(String));
    });

    it('reads the environment from navigator and window', () => {
        const env = readEnvironment({ userAgent: 'UA', language: 'fr' }, { innerWidth: 800, innerHeight: 600 });
        expect(env).toEqual({ userAgent: 'UA', language: 'fr', screen: '800x600' });
    });

    it('formats the report as text', () => {
        const text = formatReportText(
            makeReport({
                logs: [{ time: 't', level: 'warn', message: 'hmm' }],
                files: [makeFile('a.png', 'image/png', 5)],
            }),
        );
        expect(text).toContain('Description:\nBoss heals forever');
        expect(text).toContain('Steps to reproduce:\n(none)');
        expect(text).toContain('Profile: ? / Theme: ?');
        expect(text).toContain('- a.png (5 bytes)');
        expect(text).toContain('[t] warn: hmm');
        expect(formatReportText(makeReport())).not.toContain('Logs:');
    });
});

describe('transports', () => {
    it('HTTP transport posts the report and files as FormData', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 });
        const transport = createHttpTransport({ endpoint: 'https://example.test/bugs', fetchImpl });
        const file = makeFile('shot.png', 'image/png');
        const report = makeReport();

        await expect(transport.send(report, [file])).resolves.toEqual({ kind: 'http' });

        const [url, init] = fetchImpl.mock.calls[0];
        expect(url).toBe('https://example.test/bugs');
        expect(init.method).toBe('POST');
        expect(JSON.parse(await readBlob(init.body.get('report')))).toEqual(report);
        expect(init.body.getAll('attachments').map((f) => f.name)).toEqual(['shot.png']);
    });

    it('HTTP transport fails on a bad status', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 });
        const transport = createHttpTransport({ endpoint: 'https://example.test/bugs', fetchImpl });
        await expect(transport.send(makeReport())).rejects.toThrow('status 500');
    });

    it('mailto transport opens a prefilled email', async () => {
        const openUrl = vi.fn();
        const transport = createMailtoTransport({ email: 'dev@example.test', openUrl });
        await expect(transport.send(makeReport())).resolves.toEqual({ kind: 'mailto' });
        const url = openUrl.mock.calls[0][0];
        expect(url.startsWith('mailto:dev%40example.test?subject=Bug%20report%3A%20Boss%20heals%20forever&body=')).toBe(
            true,
        );
        expect(decodeURIComponent(url.split('body=')[1])).toContain('Boss heals forever');
    });

    it('mailto body is cut when too long', () => {
        const logs = Array.from({ length: 50 }, () => ({ time: 't', level: 'error', message: 'y'.repeat(100) }));
        const body = decodeURIComponent(buildMailtoUrl('', makeReport({ logs })).split('body=')[1]);
        expect(body.length).toBeLessThan(MAX_MAILTO_BODY + 100);
        expect(body).toContain('[Cut.');
    });

    it('createTransport picks HTTP when an endpoint is set, else mailto', () => {
        expect(createTransport({ endpoint: 'https://example.test', email: '' }).kind).toBe('http');
        expect(createTransport({ endpoint: '', email: 'dev@example.test' }).kind).toBe('mailto');
    });

    it('default openers use the real fetch and location', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true });
        await createTransport({ endpoint: 'https://example.test' }).send(makeReport());
        expect(fetchSpy).toHaveBeenCalledOnce();
        fetchSpy.mockRestore();
    });

    it('HTTP transport sends no abort signal when AbortSignal.timeout is missing', async () => {
        const original = AbortSignal.timeout;
        AbortSignal.timeout = undefined;
        try {
            const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
            await createHttpTransport({ endpoint: 'https://example.test', fetchImpl }).send(makeReport());
            expect(fetchImpl.mock.calls[0][1].signal).toBeUndefined();
        } finally {
            AbortSignal.timeout = original;
            vi.restoreAllMocks();
        }
    });

    it('default mailto opener sends the browser to the mailto URL', async () => {
        const assign = vi.fn();
        vi.stubGlobal('window', { location: { assign } });
        try {
            await createTransport({ endpoint: '', email: 'dev@example.test' }).send(makeReport());
        } finally {
            vi.unstubAllGlobals();
        }
        expect(assign).toHaveBeenCalledWith(expect.stringMatching(/^mailto:dev%40example\.test\?/));
    });

    it('downloads the report as a JSON file', () => {
        const urlApi = { createObjectURL: vi.fn(() => 'blob:fake'), revokeObjectURL: vi.fn() };
        const clicks = [];
        const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
            clicks.push({ href: this.href, download: this.download });
        });
        downloadReportJson(makeReport(), { urlApi });
        expect(clicks).toEqual([{ href: 'blob:fake', download: 'bug-report-2026-11-25T12-00-00-000Z.json' }]);
        expect(urlApi.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
        clickSpy.mockRestore();
    });
});
