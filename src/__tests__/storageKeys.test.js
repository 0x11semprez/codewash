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
    migrateSaveData,
    PROFILE_IDS,
    THEME_ID_RENAMES,
} from '../services/storageKeys';
import {
    MOB_NAME_RENAMES,
    THEME_CONFIG,
    HOSTILE_MOBS,
    BOSS_MOBS,
    MINIBOSS_MOBS,
    FRIENDLY_MOBS,
    CHEST_BLOCKS,
} from '../constants/gameData';

describe('storage key names', () => {
    it('keep the exact names saved on players computers', () => {
        expect(STORAGE_KEYS).toEqual({
            currentProfile: 'currentProfile_v1',
            profileNames: 'heroProfileNames_v1',
            parentStatus: 'heroParentStatus_v1',
            phantomLastSpawn: 'phantomEvent_lastSpawn_v1',
            legacySkills: 'heroSkills_v23',
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

describe('migrateSaveData', () => {
    it('moves the old theme ids to the renamed themes', () => {
        expect(migrateSaveData({ theme: 'minecraft', skills: {} }).theme).toBe('blocks');
        expect(migrateSaveData({ theme: 'pokemon', skills: {} }).theme).toBe('monsters');
        expect(migrateSaveData({ theme: 'kpop', skills: {} }).theme).toBe('idols');
        Object.values(THEME_ID_RENAMES).forEach((id) => expect(THEME_CONFIG).toHaveProperty(id));
    });

    it('renames the saved creatures and the defeated lists, so achievement progress is kept', () => {
        const save = {
            theme: 'space',
            skills: {
                reading: { level: 4, readingMob: 'Creeper', currentBoss: 'Wither', currentMiniboss: 'Creaking' },
                memory: { level: 2, memoryMob: 'Allay' },
                cleaning: { level: 1 },
            },
            stats: {
                uniqueMobsDefeated: ['Zombie', 'Creeper', 'Boomer'],
                uniqueBossesDefeated: ['Ender Dragon', 'Warden'],
                uniqueMinibossesDefeated: ['Wither Skeleton'],
                totalDeaths: 3,
            },
        };
        const migrated = migrateSaveData(save);
        expect(migrated.theme).toBe('space');
        expect(migrated.skills.reading).toEqual({
            level: 4,
            readingMob: 'Boomer',
            currentBoss: 'Skull King',
            currentMiniboss: 'Tree Spirit',
        });
        expect(migrated.skills.memory.memoryMob).toBe('Sky Sprite');
        expect(migrated.stats.uniqueMobsDefeated).toEqual(['Zombie', 'Boomer']);
        expect(migrated.stats.uniqueBossesDefeated).toEqual(['Void Dragon', 'Warden']);
        expect(migrated.stats.uniqueMinibossesDefeated).toEqual(['Dark Skeleton']);
        expect(migrated.stats.totalDeaths).toBe(3);
    });

    it('updates an old save that keeps the skills at the top level', () => {
        const migrated = migrateSaveData({ math: { level: 3, mathMob: 'Ghast' }, theme: 'kpop' });
        expect(migrated).toEqual({ math: { level: 3, mathMob: 'Sky Ghost' }, theme: 'idols' });
    });

    it('returns the same object when nothing changes', () => {
        const save = { theme: 'ocean', skills: { math: { mathMob: 'Eel' } }, stats: { uniqueMobsDefeated: ['Eel'] } };
        expect(migrateSaveData(save)).toBe(save);
        expect(migrateSaveData(null)).toBeNull();
        expect(migrateSaveData([1])).toEqual([1]);
    });

    it('maps every old name to a creature of the default theme', () => {
        const names = Object.keys({
            ...HOSTILE_MOBS,
            ...BOSS_MOBS,
            ...MINIBOSS_MOBS,
            ...FRIENDLY_MOBS,
            ...CHEST_BLOCKS,
        });
        Object.entries(MOB_NAME_RENAMES).forEach(([oldName, newName]) => {
            expect(names).toContain(newName);
            expect(names).not.toContain(oldName);
        });
    });
});

describe('migrateStorage on theme and creature names', () => {
    beforeEach(() => vi.stubGlobal('localStorage', createMemoryStorage()));
    afterEach(() => vi.unstubAllGlobals());

    it('rewrites the save of every profile', () => {
        localStorage.setItem(skillsKey(1), JSON.stringify({ theme: 'pokemon', skills: {} }));
        localStorage.setItem(
            skillsKey(3),
            JSON.stringify({ theme: 'minecraft', skills: { math: { mathMob: 'Piglin' } } }),
        );
        migrateStorage();
        expect(JSON.parse(localStorage.getItem(skillsKey(1))).theme).toBe('monsters');
        const third = JSON.parse(localStorage.getItem(skillsKey(3)));
        expect(third.theme).toBe('blocks');
        expect(third.skills.math.mathMob).toBe('Pig Warrior');
        expect(localStorage.getItem(skillsKey(2))).toBeNull();
        expect(PROFILE_IDS).toEqual([1, 2, 3]);
    });

    it('leaves an unchanged or unreadable save alone', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem(skillsKey(1), '{bad json');
        localStorage.setItem(skillsKey(2), '{"theme":"space","skills":{}}');
        migrateStorage();
        expect(localStorage.getItem(skillsKey(1))).toBe('{bad json');
        expect(localStorage.getItem(skillsKey(2))).toBe('{"theme":"space","skills":{}}');
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
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
    const others = ['phantomEvent_lastSpawn_v1', 'borderEffect_p', 'borderColor_p'];

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
