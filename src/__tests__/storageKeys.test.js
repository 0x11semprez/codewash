import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createMemoryStorage } from './helpers/memoryStorage';
import {
    STORAGE_KEYS,
    skillsKey,
    borderEffectKey,
    borderColorKey,
    migrateKey,
    migrateStorage,
} from '../services/storageKeys';

describe('storage key names', () => {
    it('keep the exact names saved on players computers', () => {
        expect(STORAGE_KEYS).toEqual({
            currentProfile: 'currentProfile_v1',
            profileNames: 'heroProfileNames_v1',
            parentStatus: 'heroParentStatus_v1',
            phantomLastSpawn: 'phantomEvent_lastSpawn_v1',
            legacySkills: 'heroSkills_v23',
            language: 'language_v1',
        });
    });

    it('build the per-profile keys', () => {
        expect(skillsKey(2)).toBe('heroSkills_v23_p2');
        expect(borderEffectKey(3)).toBe('borderEffect_p3');
        expect(borderColorKey(1)).toBe('borderColor_p1');
    });
});

describe('migrateKey', () => {
    beforeEach(() => vi.stubGlobal('localStorage', createMemoryStorage()));
    afterEach(() => vi.unstubAllGlobals());

    it('moves the value to the new key and removes the old one', () => {
        localStorage.setItem('old', 'data');
        expect(migrateKey('old', 'new')).toBe(true);
        expect(localStorage.getItem('new')).toBe('data');
        expect(localStorage.getItem('old')).toBeNull();
    });

    it('does nothing when there is nothing to move', () => {
        expect(migrateKey('old', 'new')).toBe(false);
        expect(localStorage.getItem('new')).toBeNull();
    });

    it('never overwrites a value already saved under the new key', () => {
        localStorage.setItem('old', 'old data');
        localStorage.setItem('new', 'new data');
        expect(migrateKey('old', 'new')).toBe(false);
        expect(localStorage.getItem('new')).toBe('new data');
        expect(localStorage.getItem('old')).toBe('old data');
    });

    it('does not crash when the storage is unavailable', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => {
                throw new Error('blocked');
            },
        });
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(migrateKey('old', 'new')).toBe(false);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });
});

describe('migrateStorage', () => {
    beforeEach(() => vi.stubGlobal('localStorage', createMemoryStorage()));
    afterEach(() => vi.unstubAllGlobals());

    it('moves the first save of the original game to profile 1', () => {
        localStorage.setItem(STORAGE_KEYS.legacySkills, '{"skills":{}}');
        migrateStorage();
        expect(localStorage.getItem(skillsKey(1))).toBe('{"skills":{}}');
        expect(localStorage.getItem(STORAGE_KEYS.legacySkills)).toBeNull();
    });
});

describe('renaming a key', () => {
    beforeEach(() => vi.stubGlobal('localStorage', createMemoryStorage()));
    afterEach(() => vi.unstubAllGlobals());

    it('loses the save without a migration, and keeps it with one', () => {
        localStorage.setItem('heroSkills_v23_p1', '{"level":26}');
        const renamedKey = 'heroSkills_v24_p1';
        expect(localStorage.getItem(renamedKey)).toBeNull();
        migrateKey('heroSkills_v23_p1', renamedKey);
        expect(localStorage.getItem(renamedKey)).toBe('{"level":26}');
    });
});

describe('storage keys in the source code', () => {
    const src = join(import.meta.dirname, '..');
    const files = readdirSync(src, { recursive: true })
        .filter((file) => /\.(js|jsx)$/.test(file) && !file.startsWith('__tests__') && !file.endsWith('storageKeys.js'))
        .map((file) => join(src, file));
    const names = ['heroSkills_v23', 'currentProfile_v1', 'heroProfileNames_v1', 'heroParentStatus_v1'];
    const others = ['phantomEvent_lastSpawn_v1', 'borderEffect_p', 'borderColor_p', 'language_v1'];

    it('are written in one file only', () => {
        const found = [];
        files.forEach((file) => {
            const text = readFileSync(file, 'utf8');
            [...names, ...others].forEach((name) => {
                if (text.includes(name)) found.push(`${file}: ${name}`);
            });
        });
        expect(found).toEqual([]);
    });

    it('live in src/services/storageKeys.js', () => {
        expect(existsSync(join(src, 'services/storageKeys.js'))).toBe(true);
    });
});
