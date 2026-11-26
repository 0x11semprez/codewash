import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import * as gameData from '../constants/gameData';

const SRC_DIR = join(import.meta.dirname, '..');
const PUBLIC_DIR = join(SRC_DIR, '..', 'public');

// GIFs above this size must be converted to animated WebP (see docs/adr/011).
const GIF_SIZE_LIMIT = 200 * 1024;

const IMAGE_PATH = /assets\/[\w./-]+?\.(?:png|jpe?g|gif|webp|svg)/g;

const collectStrings = (value, out = []) => {
    if (typeof value === 'string') out.push(value);
    else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
    else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, out));
    return out;
};

// src/constants/assets.js is a dead file with placeholder paths. Nothing imports it.
// It is listed for removal in docs/DEBT.md, so it is skipped here.
const SKIPPED_FILES = new Set([join(SRC_DIR, 'constants', 'assets.js')]);

const listSourceFiles = (dir) =>
    readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return name === '__tests__' ? [] : listSourceFiles(path);
        return /\.(jsx?|css)$/.test(name) && !SKIPPED_FILES.has(path) ? [path] : [];
    });

// Every image path held in the gameData exports, including url('...') values.
const gameDataPaths = [
    ...new Set(collectStrings(Object.values(gameData)).flatMap((text) => text.match(IMAGE_PATH) || [])),
];

// Every image path written as a literal anywhere in src/, outside the tests.
const sourcePaths = [
    ...new Set(listSourceFiles(SRC_DIR).flatMap((file) => readFileSync(file, 'utf8').match(IMAGE_PATH) || [])),
];

// Files under public/ are served as is. Files under src/assets/ are imported and bundled by Vite.
const exists = (path) => existsSync(join(PUBLIC_DIR, path)) || existsSync(join(SRC_DIR, path));
const missing = (paths) => paths.filter((path) => !exists(path));

describe('referenced image assets', () => {
    it('finds image paths to check', () => {
        // Theme pictures are listed in src/themes/*.json and only appear in gameData.
        expect(gameDataPaths.length).toBeGreaterThan(50);
        expect(sourcePaths.length).toBeGreaterThan(50);
    });

    it('every image path in gameData exists under public/', () => {
        expect(missing(gameDataPaths)).toEqual([]);
    });

    it('every image path written in src/ exists under public/', () => {
        expect(missing(sourcePaths)).toEqual([]);
    });

    it(`no referenced image is a GIF above ${GIF_SIZE_LIMIT / 1024} KB`, () => {
        const heavyGifs = sourcePaths
            .filter((path) => path.endsWith('.gif') && existsSync(join(PUBLIC_DIR, path)))
            .filter((path) => statSync(join(PUBLIC_DIR, path)).size > GIF_SIZE_LIMIT);
        expect(heavyGifs).toEqual([]);
    });
});
