import { describe, it, expect, vi, beforeEach } from 'vitest';
import { preloadStartupAssets } from '../utils/preloadStartupAssets';

const installImage = (okFor) => {
    vi.stubGlobal(
        'Image',
        class {
            constructor() {
                this.complete = false;
                this.naturalWidth = 0;
            }
            set src(value) {
                queueMicrotask(() => (okFor(value) ? this.onload?.() : this.onerror?.()));
            }
        },
    );
};

const installAudio = (event) => {
    vi.stubGlobal(
        'Audio',
        class {
            constructor() {
                this.listeners = {};
            }
            addEventListener(name, cb) {
                this.listeners[name] = cb;
            }
            removeEventListener() {}
            load() {
                queueMicrotask(() => this.listeners[event]?.());
            }
            set src(_) {}
        },
    );
};

describe('preloadStartupAssets', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        vi.stubGlobal('localStorage', { getItem: () => null });
        installAudio('canplaythrough');
    });

    it('reports progress up to 100% and no critical failures', async () => {
        installImage(() => true);
        const onProgress = vi.fn();
        const result = await preloadStartupAssets(onProgress);
        expect(result.failedCritical).toEqual([]);
        expect(onProgress).toHaveBeenLastCalledWith(expect.objectContaining({ percent: 100, completed: result.total }));
    });

    it('lists critical images that fail to load', async () => {
        installImage((src) => !src.includes('logo'));
        const result = await preloadStartupAssets();
        expect(result.failedCritical.length).toBeGreaterThan(0);
    });

    it('falls back to the default theme when saved data is corrupted and warns on audio errors', async () => {
        vi.stubGlobal('localStorage', { getItem: () => '{bad' });
        installImage(() => true);
        installAudio('error');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        await preloadStartupAssets();
        await new Promise((resolve) => setTimeout(resolve, 10));
        expect(warn).toHaveBeenCalled();
    });

    it('counts images the browser already has in cache as loaded', async () => {
        vi.stubGlobal(
            'Image',
            class {
                constructor() {
                    this.complete = false;
                    this.naturalWidth = 0;
                }
                set src(_) {
                    this.complete = true;
                    this.naturalWidth = 16;
                }
            },
        );
        const result = await preloadStartupAssets();
        expect(result.failedCritical).toEqual([]);
        expect(result.total).toBeGreaterThan(0);
    });

    it('also preloads the sprites that are visible on screen, but not the hidden ones', async () => {
        const loaded = [];
        installImage((src) => {
            loaded.push(src);
            return true;
        });
        document.body.innerHTML =
            '<div id="root"><main><img id="on" src="/on-screen.png"><img id="off" src="/off-screen.png"></main></div>';
        const place = (id, rect) => {
            document.getElementById(id).getBoundingClientRect = () => rect;
        };
        place('on', { top: 10, left: 10, bottom: 50, right: 50 });
        place('off', { top: 10, left: window.innerWidth + 10, bottom: 50, right: window.innerWidth + 50 });
        try {
            await preloadStartupAssets();
        } finally {
            document.body.innerHTML = '';
        }
        expect(loaded.some((src) => src.endsWith('/on-screen.png'))).toBe(true);
        expect(loaded.some((src) => src.endsWith('/off-screen.png'))).toBe(false);
    });
});
