// Counts running and paused CSS animations in the built app, through the Chrome DevTools Protocol.
// Usage: node tools/measure-animations.mjs <cdpPort> <appUrl> <before|after> <seconds>
// See docs/missions/performance.md, section 4.6.
const [port, appUrl, mode, secs = '5'] = process.argv.slice(2);
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
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
const evaluate = async (expr) =>
    (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result
        ?.value;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await send('Runtime.enable');
await send('Performance.enable');
await send('Page.navigate', { url: appUrl });
for (let i = 0; i < 120; i++) {
    await wait(500);
    await evaluate(`document.querySelector('.loading-screen__continue')?.click()`);
    if (await evaluate(`!document.querySelector('.loading-screen') && !!document.querySelector('.perspective-1000')`))
        break;
}
// Mount both drawers once, then close them. They stay mounted off-screen.
await evaluate(`document.querySelector('button:has(.lucide-sparkles)')?.click()`);
await wait(800);
await evaluate(`document.querySelector('button:has(.lucide-settings)')?.click()`);
await wait(800);
await evaluate(`[...document.querySelectorAll('div.fixed.inset-0')].find(d => d.className.includes('bg-black'))?.click()`);
await wait(1500);
if (mode === 'before') {
    // Remove the pause rules from the CSSOM. The attributes stay but do nothing, as before the change.
    await evaluate(`(() => { for (const s of document.styleSheets) { try { const walk = (list, owner) => { for (let i = list.length - 1; i >= 0; i--) { const r = list[i]; if (r.cssRules) walk(r.cssRules, r); if (r.selectorText && r.selectorText.includes('data-offscreen')) owner.deleteRule(i); } }; walk(s.cssRules, s); } catch (e) {} } })()`);
}
await wait(500);
const counts = await evaluate(
    `(() => { const a = document.getAnimations(); return { total: a.length, running: a.filter(x => x.playState === 'running').length, paused: a.filter(x => x.playState === 'paused').length, offscreenEls: document.querySelectorAll('[data-offscreen]').length, closedDrawers: document.querySelectorAll('.-translate-x-full, .translate-x-full').length }; })()`,
);
const metrics = async () =>
    Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]));
const m0 = await metrics();
const frames = await evaluate(
    `new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < ${secs * 1000}) requestAnimationFrame(f); else r(n); }; requestAnimationFrame(f); })`,
);
const m1 = await metrics();
const d = (k) => m1[k] - m0[k];
console.log(
    JSON.stringify({
        mode,
        ...counts,
        rafFrames: frames,
        recalcStyleCount: d('RecalcStyleCount'),
        recalcStyleMs: +(d('RecalcStyleDuration') * 1000).toFixed(1),
        layoutCount: d('LayoutCount'),
        taskMs: +(d('TaskDuration') * 1000).toFixed(1),
    }),
);
await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`);
process.exit(0);
