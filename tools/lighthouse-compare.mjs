// Fair before/after performance comparison of two builds of the game.
// Usage: node tools/lighthouse-compare.mjs <beforeUrl> <afterUrl> [runs=5] [outDir=perf-results]
// Before each measurement it waits (20 minutes at most) until the 1-minute load average is below MAX_LOAD
// (default 4). Set MAX_LOAD=999 to start at once; the load is still written down for each run.
// Needs Chromium (set CHROME_PATH, default /usr/bin/chromium) and network access for `npx lighthouse`.
// See docs/missions/performance.md, section 4.2.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [beforeUrl, afterUrl, runsArg = '5', outDir = 'perf-results'] = process.argv.slice(2);
if (!beforeUrl || !afterUrl) {
    console.error('Usage: node tools/lighthouse-compare.mjs <beforeUrl> <afterUrl> [runs] [outDir]');
    process.exit(1);
}
const RUNS = Number(runsArg);
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';
const LIGHTHOUSE = process.env.LIGHTHOUSE_VERSION || '13.6.0';
const WINDOW = '1280,720';
const IDLE_SECONDS = 5;
mkdirSync(outDir, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const loadAverage = () => Number(readFileSync('/proc/loadavg', 'utf8').split(' ')[0]);
// A busy machine slows both versions in a random way. Wait until the 1-minute load average is low enough.
const MAX_LOAD = Number(process.env.MAX_LOAD || 4);
async function waitForQuietMachine() {
    for (let i = 0; i < 120 && loadAverage() > MAX_LOAD; i++) await wait(10000);
    return loadAverage();
}

// 1. Lighthouse, desktop preset. Each run starts Chrome with a new temporary profile, so storage is empty
//    and every version starts on its default theme.
function lighthouse(url, file) {
    const res = spawnSync(
        'npx',
        [
            '--yes',
            `lighthouse@${LIGHTHOUSE}`,
            url,
            '--only-categories=performance',
            '--preset=desktop',
            '--output=json',
            `--output-path=${file}`,
            '--quiet',
            `--chrome-flags=--headless=new --no-first-run --window-size=${WINDOW}`,
        ],
        { env: { ...process.env, CHROME_PATH: CHROME }, stdio: ['ignore', 'ignore', 'inherit'] },
    );
    if (res.status !== 0) throw new Error(`lighthouse failed on ${url}`);
    const lhr = JSON.parse(readFileSync(file, 'utf8'));
    const a = lhr.audits;
    const requests = a['network-requests'].details.items;
    const scripts = requests.filter((r) => r.resourceType === 'Script');
    return {
        score: Math.round(lhr.categories.performance.score * 100),
        fcp: a['first-contentful-paint'].numericValue,
        lcp: a['largest-contentful-paint'].numericValue,
        tbt: a['total-blocking-time'].numericValue,
        cls: a['cumulative-layout-shift'].numericValue,
        si: a['speed-index'].numericValue,
        bytes: a['total-byte-weight'].numericValue,
        requests: requests.length,
        jsBytes: scripts.reduce((s, r) => s + (r.transferSize || 0), 0),
        mainThread: a['mainthread-work-breakdown'].numericValue,
    };
}

// 2. Chrome DevTools Protocol run: time until the main menu is usable, then frame times on the idle menu.
//    No throttling: the page is served from localhost, as in the Electron app.
const PROBE = `(() => {
    const t = (window.__perf = { usable: null, loader100: null, longTasks: [] });
    try {
        new PerformanceObserver((l) => l.getEntries().forEach((e) => t.longTasks.push([e.startTime, e.duration])))
            .observe({ type: 'longtask', buffered: true });
    } catch (e) {}
    const visibleImagesLoaded = () => [...document.images].every((img) => {
        const r = img.getBoundingClientRect();
        const onScreen = r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
        return !onScreen || img.complete;
    });
    const check = () => {
        if (t.loader100 === null && document.querySelector('[role="progressbar"][aria-valuenow="100"]')) t.loader100 = performance.now();
        if (!document.querySelector('.loading-screen') && document.querySelector('.perspective-1000') && visibleImagesLoaded()) {
            t.usable = performance.now();
            return;
        }
        setTimeout(check, 10);
    };
    check();
})()`;

async function cdpRun(url, port) {
    const profile = mkdtempSync(join(tmpdir(), 'codewash-perf-'));
    const chrome = spawn(
        CHROME,
        [
            '--headless=new',
            '--no-first-run',
            '--no-default-browser-check',
            `--user-data-dir=${profile}`,
            `--remote-debugging-port=${port}`,
            `--window-size=${WINDOW}`,
            'about:blank',
        ],
        { stdio: 'ignore' },
    );
    try {
        let target;
        for (let i = 0; i < 50 && !target; i++) {
            await wait(200);
            target = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })
                .then((r) => r.json())
                .catch(() => undefined);
        }
        const ws = new WebSocket(target.webSocketDebuggerUrl);
        await new Promise((r) => ws.addEventListener('open', r));
        let id = 0;
        const pending = new Map();
        ws.addEventListener('message', (e) => {
            const m = JSON.parse(e.data);
            if (m.id && pending.has(m.id)) {
                pending.get(m.id)(m);
                pending.delete(m.id);
            }
        });
        const send = (method, params = {}) =>
            new Promise((r) => {
                const i = ++id;
                pending.set(i, r);
                ws.send(JSON.stringify({ id: i, method, params }));
            });
        const evaluate = async (expression) =>
            (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result
                ?.value;
        await send('Page.enable');
        await send('Runtime.enable');
        await send('Performance.enable');
        await send('Page.addScriptToEvaluateOnNewDocument', { source: PROBE });
        await send('Page.navigate', { url });
        let usable = null;
        let continueClicked = false;
        for (let i = 0; i < 600 && usable === null; i++) {
            await wait(100);
            continueClicked ||= !!(await evaluate(
                `(() => { const b = document.querySelector('.loading-screen__continue'); b?.click(); return !!b; })()`,
            ));
            usable = await evaluate('window.__perf && window.__perf.usable');
        }
        await wait(2000);
        const metrics = async () =>
            Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]));
        const m0 = await metrics();
        const idle = await evaluate(`new Promise((resolve) => {
            const frames = []; const t0 = performance.now(); let last = t0;
            const lt0 = window.__perf.longTasks.length;
            const f = (now) => { frames.push(now - last); last = now;
                if (now - t0 < ${IDLE_SECONDS * 1000}) requestAnimationFrame(f);
                else resolve({ frames: frames.slice(1), longTasks: window.__perf.longTasks.slice(lt0) }); };
            requestAnimationFrame(f);
        })`);
        const m1 = await metrics();
        const perf = await evaluate('window.__perf');
        const startupLong = perf.longTasks.filter(([start]) => start <= usable);
        const sorted = [...idle.frames].sort((x, y) => x - y);
        ws.close();
        return {
            usable,
            loader100: perf.loader100,
            continueClicked,
            startupLongTasks: startupLong.length,
            startupLongTaskMs: startupLong.reduce((s, [, d]) => s + d, 0),
            fps: idle.frames.length / IDLE_SECONDS,
            frameMedian: sorted[Math.floor(sorted.length / 2)],
            frameP95: sorted[Math.floor(sorted.length * 0.95)],
            idleLongTasks: idle.longTasks.length,
            idleBusyPct: ((m1.TaskDuration - m0.TaskDuration) / IDLE_SECONDS) * 100,
        };
    } finally {
        chrome.kill();
        await wait(500);
        rmSync(profile, { recursive: true, force: true });
    }
}

const median = (xs) => {
    const v = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b);
    if (!v.length) return null;
    const m = Math.floor(v.length / 2);
    return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};

const versions = { before: beforeUrl, after: afterUrl };
const results = { before: [], after: [] };
// Runs alternate between the two versions so a change in machine load affects both the same way.
for (let run = 1; run <= RUNS; run++) {
    for (const [name, url] of Object.entries(versions)) {
        const load = await waitForQuietMachine();
        const lh = lighthouse(url, join(outDir, `lighthouse-${name}-${run}.json`));
        const cdp = await cdpRun(url, 9400 + run);
        const row = { run, load, loadAfter: loadAverage(), ...lh, ...cdp };
        results[name].push(row);
        // Saved after every run, so a stopped comparison keeps the runs already done.
        writeFileSync(join(outDir, 'runs.json'), JSON.stringify(results, null, 2));
        console.error(`${name} run ${run}: load ${load} to ${row.loadAfter}, score ${lh.score}, usable ${Math.round(cdp.usable)} ms`);
    }
}

const keys = Object.keys(results.before[0]).filter((k) => !['run', 'continueClicked'].includes(k));
const summary = Object.fromEntries(
    keys.map((k) => [k, { before: median(results.before.map((r) => r[k])), after: median(results.after.map((r) => r[k])) }]),
);
writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
console.table(summary);
