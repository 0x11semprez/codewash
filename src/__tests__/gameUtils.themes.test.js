import { describe, it, expect } from 'vitest';
import {
    pickStable,
    getRandomMob,
    getRandomFriendlyMob,
    getRandomMiniboss,
    getRandomBoss,
    getMobForSkill,
    getWordForDifficulty,
} from '../utils/gameUtils';
import { THEME_CONFIG } from '../constants/gameData';

const space = THEME_CONFIG.space;
const ocean = THEME_CONFIG.ocean;
const LOW = () => 0;

describe('pickStable', () => {
    it('keeps a name that belongs to the list', () => {
        expect(pickStable('Drone', ['Wasp', 'Drone'])).toBe('Drone');
    });

    it('maps an unknown name to the same list entry every time', () => {
        const names = Object.keys(space.enemies);
        const first = pickStable('Creeper', names);
        expect(names).toContain(first);
        expect(pickStable('Creeper', names)).toBe(first);
    });

    it('returns the name when the list is empty', () => {
        expect(pickStable('Creeper', [])).toBe('Creeper');
    });
});

describe('random picks follow the theme', () => {
    it('picks enemies, friends, minibosses and bosses of the theme', () => {
        expect(space.enemies).toHaveProperty(getRandomMob(null, Math.random, space));
        expect(space.friends).toHaveProperty(getRandomFriendlyMob(Math.random, space));
        expect(space.minibosses).toHaveProperty(getRandomMiniboss(Math.random, space));
        expect(space.bosses).toHaveProperty(getRandomBoss(Math.random, space));
    });

    it('skips the excluded enemy', () => {
        const [first, second] = Object.keys(ocean.enemies);
        expect(getRandomMob(first, LOW, ocean)).toBe(second);
    });
});

describe('getMobForSkill with a theme', () => {
    it('shows the containers of the theme in the cleaning skill', () => {
        expect(getMobForSkill({ id: 'cleaning' }, { level: 20 }, LOW, space)).toBe('Star Pod');
        expect(getMobForSkill({ id: 'cleaning' }, { level: 5 }, LOW, space)).toBe('Shield Pod');
        expect(getMobForSkill({ id: 'cleaning' }, { level: 1 }, LOW, space)).toBe('Blue Pod');
        expect(getMobForSkill({ id: 'cleaning' }, { level: 2 }, LOW, ocean)).toBe('Dinghy');
    });

    it('maps creatures saved under another theme to creatures of this theme', () => {
        const reading = getMobForSkill({ id: 'reading' }, { level: 1, readingMob: 'Zombie' }, LOW, space);
        expect(space.enemies).toHaveProperty(reading);
        const boss = getMobForSkill({ id: 'math' }, { level: 20, currentBoss: 'Wither' }, LOW, space);
        expect(space.bosses).toHaveProperty(boss);
        const miniboss = getMobForSkill({ id: 'math' }, { level: 10, currentMiniboss: 'Ravager' }, LOW, ocean);
        expect(ocean.minibosses).toHaveProperty(miniboss);
        const friend = getMobForSkill({ id: 'memory' }, { level: 1, memoryMob: 'Cat' }, LOW, ocean);
        expect(ocean.friends).toHaveProperty(friend);
    });

    it('keeps a saved creature that belongs to the theme', () => {
        expect(getMobForSkill({ id: 'writing' }, { level: 3, writingMob: 'Comet' }, LOW, space)).toBe('Comet');
    });

    it('picks a theme enemy for an unknown skill', () => {
        expect(space.enemies).toHaveProperty(getMobForSkill({ id: 'other' }, { level: 1 }, LOW, space));
        expect(getMobForSkill({ id: 'other' }, { level: 1, currentMob: 'Drone' }, LOW, space)).toBe('Drone');
    });
});

describe('getWordForDifficulty with theme pools', () => {
    it('returns a word and picture of the theme for every difficulty', () => {
        [1, 2, 3, 4, 5, 6, 7].forEach((difficulty) => {
            const word = getWordForDifficulty(difficulty, Math.random, space.writingPools);
            expect(word.image).toMatch(/^assets\/themes\/space\//);
            expect(word.word).toBe(word.word.toUpperCase());
        });
    });

    it('falls back to pool 1 when a pool is empty', () => {
        const pools = { 1: [{ word: 'cat', displayName: 'Cat', imagePath: 'cat.png' }], 2: [] };
        expect(getWordForDifficulty(2, LOW, pools)).toEqual({ word: 'CAT', displayName: 'Cat', image: 'cat.png' });
    });
});
