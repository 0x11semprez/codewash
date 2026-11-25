import { describe, it, expect, vi } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { getBGMManager, setSfxVolume, getSfxVolume, UI_SOUND_NAMES } from '../utils/soundManager';

vi.stubGlobal(
    'Audio',
    class {
        constructor() {
            this.volume = 1;
            this.src = '';
        }
        play() {
            return Promise.resolve();
        }
        pause() {}
        addEventListener() {}
    },
);

describe('getSfxVolume / setSfxVolume', () => {
    it('defaults to 0.5', () => {
        setSfxVolume(0.5);
        expect(getSfxVolume()).toBe(0.5);
    });

    it('updates volume', () => {
        setSfxVolume(0.8);
        expect(getSfxVolume()).toBe(0.8);
        setSfxVolume(0.5);
    });
});

describe('UI_SOUND_NAMES', () => {
    it('contains expected sound names', () => {
        expect(UI_SOUND_NAMES).toContain('click');
        expect(UI_SOUND_NAMES).toContain('death');
        expect(UI_SOUND_NAMES).toContain('fail');
        expect(UI_SOUND_NAMES).toContain('levelup');
        expect(UI_SOUND_NAMES).toContain('notification');
        expect(UI_SOUND_NAMES).toContain('successful_hit');
    });
});

describe('BGMManager', () => {
    it('getBGMManager returns singleton', () => {
        const a = getBGMManager();
        const b = getBGMManager();
        expect(a).toBe(b);
    });

    it('setVolume updates volume', () => {
        const mgr = getBGMManager();
        mgr.setVolume(0.7);
        expect(mgr.volume).toBe(0.7);
    });
});

describe('BGM tracks', () => {
    const tracks = getBGMManager().tracks;
    const fromPublic = (track) => join(import.meta.dirname, '..', '..', 'public', track);

    it('lists the six background music tracks', () => {
        expect(tracks).toHaveLength(6);
    });

    it('uses compressed MP3 files', () => {
        tracks.forEach((track) => expect(track).toMatch(/^assets\/sounds\/bgm\/[a-z0-9]+\.mp3$/));
    });

    it('points to files that exist', () => {
        tracks.forEach((track) => expect(existsSync(fromPublic(track))).toBe(true));
    });

    it('keeps every track under 10 MB', () => {
        tracks.forEach((track) => expect(statSync(fromPublic(track)).size).toBeLessThan(10 * 1024 * 1024));
    });
});
