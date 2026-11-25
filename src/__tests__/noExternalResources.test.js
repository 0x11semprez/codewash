import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const src = join(import.meta.dirname, '..');
const ALLOWED_HOSTS = ['www.w3.org'];

const sourceFiles = readdirSync(src, { recursive: true })
    .filter((file) => /\.(js|jsx|css)$/.test(file) && !file.startsWith('__tests__'))
    .map((file) => join(src, file));

describe('offline game', () => {
    it('loads no resource from an external website', () => {
        const external = [];
        sourceFiles.forEach((file) => {
            const urls = readFileSync(file, 'utf8').match(/https?:\/\/[^\s'")`]+/g) || [];
            urls.forEach((url) => {
                if (!ALLOWED_HOSTS.some((host) => url.includes(host))) external.push(`${file}: ${url}`);
            });
        });
        expect(external).toEqual([]);
    });

    it('ships the font and the textures with the game', () => {
        [
            'assets/fonts/vt323-latin-400-normal.woff2',
            'assets/textures/cubes.png',
            'assets/textures/diagmonds-light.png',
        ].forEach((file) => expect(existsSync(join(src, file))).toBe(true));
    });

    it('declares the VT323 font locally', () => {
        expect(readFileSync(join(src, 'index.css'), 'utf8')).toMatch(/@font-face\s*{\s*font-family: 'VT323'/);
    });
});
