// Checks every theme in src/themes/ against the rules in docs/features/themes.md.
// Each failure names the theme and the file or field to fix.
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { Buffer } from 'node:buffer';
import { THEME_SOURCES, THEME_SPRITE_GROUPS, SKILL_DATA, SOUND_KEYS, DIFFICULTY_CONTENT } from '../constants/gameData';

const ROOT = join(import.meta.dirname, '..', '..');
const THEMES_DIR = join(ROOT, 'public', 'assets', 'themes');
const JSON_DIR = join(ROOT, 'src', 'themes');

const IMAGE_TYPES = /\.(webp|png|jpe?g|svg)$/i;
const SOUND_TYPES = /\.(ogg|mp3|wav)$/i;
const MAX_IMAGE_BYTES = 1024 * 1024;
const MAX_MUSIC_BYTES = 5 * 1024 * 1024;
const NAME_PATTERN = /^[A-Za-z][A-Za-z ]*$/;

const MAX_MEMORY_PAIRS = Math.max(...Object.values(DIFFICULTY_CONTENT.memory).map((level) => level.pairs));
const MAX_PATTERN_PIECES = Math.max(...Object.values(DIFFICULTY_CONTENT.patterns).map((level) => level.pieceCount));

// Shape each standard picture must have. See "Picture sizes" in docs/features/themes.md.
const SHAPES = {
    background: { ratio: 16 / 9, size: '1280 x 720' },
    logo: { ratio: 4, size: '1200 x 300' },
    cardBack: { ratio: 2 / 3, size: '400 x 600' },
};

const publicPath = (id, file) => (file.startsWith('assets/') ? file : `assets/themes/${id}/${file}`);
const onDisk = (id, file) => join(ROOT, 'public', publicPath(id, file));

// Reads the width and height of a PNG or WebP file. Returns null for other formats.
const readImageSize = (buffer) => {
    if (buffer.toString('ascii', 1, 4) === 'PNG') {
        return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
    }
    if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') return null;
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
        return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    }
    if (chunk === 'VP8L') {
        const bits = buffer.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (chunk === 'VP8 ') {
        return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    return null;
};

// Every file a theme points to, with the kind of file it must be.
const listFiles = (raw) => {
    const files = [];
    ['background', 'logo', 'cardBack', 'bonusCreature'].forEach((key) => {
        if (raw[key]) files.push({ field: key, file: raw[key], kind: 'image' });
    });
    [...THEME_SPRITE_GROUPS, 'patternPieces', 'skillIcons'].forEach((group) => {
        Object.entries(raw[group] || {}).forEach(([name, file]) =>
            files.push({ field: `${group} > ${name}`, file, kind: 'image' }),
        );
    });
    (raw.music || []).forEach((file, index) => files.push({ field: `music #${index + 1}`, file, kind: 'music' }));
    Object.entries(raw.sounds || {}).forEach(([key, file]) =>
        files.push({ field: `sounds > ${key}`, file, kind: 'sound' }),
    );
    return files;
};

const themes = Object.entries(THEME_SOURCES);

describe('theme folders', () => {
    it('finds the themes', () => {
        expect(themes.length).toBeGreaterThanOrEqual(6);
    });

    it('every theme folder has a JSON file and every JSON file has a folder', () => {
        const folders = readdirSync(THEMES_DIR).filter((name) => statSync(join(THEMES_DIR, name)).isDirectory());
        const jsonIds = readdirSync(JSON_DIR)
            .filter((name) => name.endsWith('.json'))
            .map((name) => name.replace(/\.json$/, ''));
        const noJson = folders.filter((id) => !jsonIds.includes(id)).map((id) => `src/themes/${id}.json is missing`);
        const noFolder = jsonIds
            .filter((id) => !folders.includes(id))
            .map((id) => `public/assets/themes/${id}/ is missing`);
        expect([...noJson, ...noFolder]).toEqual([]);
    });

    it('theme ids use lowercase letters, digits and dashes only', () => {
        expect(themes.map(([id]) => id).filter((id) => !/^[a-z0-9-]+$/.test(id))).toEqual([]);
    });

    it('theme names and menu positions are unique', () => {
        const names = themes.map(([, raw]) => raw.name);
        expect(new Set(names).size).toBe(names.length);
        const orders = themes.map(([, raw]) => raw.order);
        expect(new Set(orders).size).toBe(orders.length);
    });

    it('every JSON file is valid JSON', () => {
        readdirSync(JSON_DIR)
            .filter((name) => name.endsWith('.json'))
            .forEach((name) => {
                expect(
                    () => JSON.parse(readFileSync(join(JSON_DIR, name), 'utf8')),
                    `src/themes/${name}`,
                ).not.toThrow();
            });
    });
});

describe.each(themes)('theme "%s"', (id, raw) => {
    const files = listFiles(raw);

    it('has a name, a background, a logo and a card back', () => {
        const missing = ['name', 'background', 'logo', 'cardBack'].filter((key) => !raw[key]);
        expect(missing, `add these fields to src/themes/${id}.json`).toEqual([]);
    });

    it('points only to files that exist', () => {
        const missing = files
            .filter(({ file }) => !existsSync(onDisk(id, file)))
            .map(({ field, file }) => `${field}: public/${publicPath(id, file)} is missing`);
        expect(missing).toEqual([]);
    });

    it('uses supported file types', () => {
        const wrong = files
            .filter(({ file, kind }) => !(kind === 'image' ? IMAGE_TYPES : SOUND_TYPES).test(file))
            .map(
                ({ field, file }) =>
                    `${field}: ${file} is not a supported ${field.startsWith('music') ? 'music' : 'file'} type`,
            );
        expect(wrong).toEqual([]);
    });

    it('keeps files small', () => {
        const tooBig = files
            .filter(({ file }) => existsSync(onDisk(id, file)))
            .filter(
                ({ file, kind }) =>
                    statSync(onDisk(id, file)).size > (kind === 'music' ? MAX_MUSIC_BYTES : MAX_IMAGE_BYTES),
            )
            .map(({ field, file }) => `${field}: ${file} is too big`);
        expect(tooBig).toEqual([]);
    });

    it('has pictures with the standard shape', () => {
        const wrong = Object.entries(SHAPES)
            .filter(([key]) => raw[key] && existsSync(onDisk(id, raw[key])))
            .map(([key, { ratio, size }]) => {
                const dims = readImageSize(readFileSync(onDisk(id, raw[key])));
                if (!dims) return null;
                const off = Math.abs(dims.width / dims.height - ratio) / ratio;
                return off > 0.05 ? `${key}: ${raw[key]} is ${dims.width} x ${dims.height}, use ${size}` : null;
            })
            .filter(Boolean);
        expect(wrong).toEqual([]);
    });

    it('has square sprites', () => {
        const notSquare = files
            .filter(({ field, file }) => field.includes(' > ') && !file.startsWith('assets/'))
            .filter(({ file }) => existsSync(onDisk(id, file)))
            .map(({ field, file }) => ({ field, file, dims: readImageSize(readFileSync(onDisk(id, file))) }))
            .filter(({ dims }) => dims && dims.width !== dims.height)
            .map(({ field, file, dims }) => `${field}: ${file} is ${dims.width} x ${dims.height}, use 256 x 256`);
        expect(notSquare).toEqual([]);
    });

    it('only uses known skill ids and sound names', () => {
        const skillIds = SKILL_DATA.map((skill) => skill.id);
        const unknown = [
            ...Object.keys(raw.skills || {})
                .filter((key) => !skillIds.includes(key))
                .map((key) => `skills > ${key}`),
            ...Object.keys(raw.skillIcons || {})
                .filter((key) => !skillIds.includes(key))
                .map((key) => `skillIcons > ${key}`),
            ...Object.keys(raw.sounds || {})
                .filter((key) => !SOUND_KEYS.includes(key))
                .map((key) => `sounds > ${key}`),
        ];
        expect(unknown, `allowed skill ids: ${skillIds.join(', ')}; sounds: ${SOUND_KEYS.join(', ')}`).toEqual([]);
    });

    it('uses names that a child can type in the spelling game', () => {
        const bad = THEME_SPRITE_GROUPS.flatMap((group) =>
            Object.keys(raw[group] || {})
                .filter((name) => !NAME_PATTERN.test(name))
                .map((name) => `${group} > "${name}": use letters and spaces only`),
        );
        expect(bad).toEqual([]);
    });

    it('has enough pictures for every difficulty', () => {
        const problems = [];
        const count = (group) => Object.keys(raw[group] || {}).length;
        if (raw.friends && count('friends') < MAX_MEMORY_PAIRS) {
            problems.push(`friends: add at least ${MAX_MEMORY_PAIRS} (memory game pairs)`);
        }
        if (raw.patternPieces && count('patternPieces') < MAX_PATTERN_PIECES) {
            problems.push(`patternPieces: add at least ${MAX_PATTERN_PIECES}`);
        }
        if (raw.enemies && count('enemies') < 2) problems.push('enemies: add at least 2');
        if (raw.minibosses && count('minibosses') < 1) problems.push('minibosses: add at least 1');
        if (raw.bosses && count('bosses') < 1) problems.push('bosses: add at least 1');
        if (raw.containers) {
            [raw.milestoneContainer, raw.bossContainer].forEach((name) => {
                if (!raw.containers[name]) problems.push(`containers: "${name}" must be one of the containers`);
            });
            if (count('containers') < 3) problems.push('containers: add at least 3');
        }
        expect(problems).toEqual([]);
    });

    it('keeps a license file next to downloaded pictures or sounds', () => {
        const hasOwnFiles = files.some(({ field, file }) => !file.startsWith('assets/') && field.includes(' > '));
        const licenses = existsSync(join(THEMES_DIR, id))
            ? readdirSync(join(THEMES_DIR, id)).filter((name) => /^licen[cs]e/i.test(name))
            : [];
        if (hasOwnFiles || raw.music) {
            expect(licenses.length, `add a LICENSE text file to public/assets/themes/${id}/`).toBeGreaterThan(0);
        }
    });
});

describe('readImageSize', () => {
    it('returns null for an unknown format', () => {
        expect(readImageSize(Buffer.from('GIF89a-not-an-image-we-read'))).toBeNull();
    });

    it('reads the size of the shipped PNG and WebP pictures', () => {
        expect(readImageSize(readFileSync(join(THEMES_DIR, 'space', 'background.webp')))).toEqual({
            width: 1280,
            height: 720,
        });
        expect(
            readImageSize(readFileSync(join(ROOT, 'public', 'assets', 'mobs', 'hostile', 'zombie.png'))),
        ).not.toBeNull();
    });
});
