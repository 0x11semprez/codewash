import { describe, it, expect } from 'vitest';
import * as gameData from '../constants/gameData';
import * as items from '../constants/game/items';
import * as mobs from '../constants/game/mobs';
import * as difficulty from '../constants/game/difficulty';
import * as themes from '../constants/game/themes';
import * as words from '../constants/game/words';
import * as skills from '../constants/game/skills';

const modules = { items, mobs, difficulty, themes, words, skills };

describe('game data modules', () => {
    it('re-exports every topic module from gameData', () => {
        Object.values(modules).forEach((mod) => {
            Object.entries(mod).forEach(([name, value]) => {
                expect(gameData[name]).toBe(value);
            });
        });
    });

    it('exports each name from one topic module only', () => {
        const names = Object.values(modules).flatMap((mod) => Object.keys(mod));
        expect(new Set(names).size).toBe(names.length);
        expect(names.sort()).toEqual(Object.keys(gameData).sort());
    });
});
