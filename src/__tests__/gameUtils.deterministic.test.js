import { describe, it, expect } from 'vitest';
import {
    getRandomMob,
    getRandomFriendlyMob,
    getRandomMiniboss,
    getRandomBoss,
    getMobForSkill,
    generateMathProblem,
    getReadingWord,
    getWordForDifficulty,
} from '../utils/gameUtils';
import { getRandomAura } from '../utils/mobDisplayUtils';
import {
    HOSTILE_MOBS,
    FRIENDLY_MOBS,
    MINIBOSS_MOBS,
    BOSS_MOBS,
    READING_WORDS,
    FUNNY_LONG_WORDS,
    DIFFICULTY_CONTENT,
    WRITING_DIFFICULTY_POOLS,
} from '../constants/gameData';

// Deterministic tests: each function gets a fixed random source instead of Math.random.
const LOW = () => 0;
const HIGH = () => 0.999999;
const sequence = (values) => {
    let i = 0;
    return () => values[Math.min(i++, values.length - 1)];
};
const first = (obj) => Object.keys(obj)[0];
const last = (obj) => Object.keys(obj).at(-1);

describe('mob pickers with injected random', () => {
    it('pick the first and last mob of each pool', () => {
        expect(getRandomMob(null, LOW)).toBe(first(HOSTILE_MOBS));
        expect(getRandomMob(null, HIGH)).toBe(last(HOSTILE_MOBS));
        expect(getRandomFriendlyMob(LOW)).toBe(first(FRIENDLY_MOBS));
        expect(getRandomFriendlyMob(HIGH)).toBe(last(FRIENDLY_MOBS));
        expect(getRandomMiniboss(LOW)).toBe(first(MINIBOSS_MOBS));
        expect(getRandomMiniboss(HIGH)).toBe(last(MINIBOSS_MOBS));
        expect(getRandomBoss(LOW)).toBe(first(BOSS_MOBS));
        expect(getRandomBoss(HIGH)).toBe(last(BOSS_MOBS));
    });

    it('getRandomMob skips the excluded mob', () => {
        const keys = Object.keys(HOSTILE_MOBS);
        expect(getRandomMob(keys[0], LOW)).toBe(keys[1]);
    });

    it('getRandomAura picks first and last aura', () => {
        expect(getRandomAura(LOW)).toBe('rainbow');
        expect(getRandomAura(HIGH)).toBe('nature');
    });
});

describe('getMobForSkill with injected random', () => {
    it('memory skill without stored mob uses the injected source', () => {
        expect(getMobForSkill({ id: 'memory' }, { level: 1 }, LOW)).toBe(first(FRIENDLY_MOBS));
    });

    it('boss and miniboss levels use the injected source', () => {
        expect(getMobForSkill({ id: 'math' }, { level: 20 }, HIGH)).toBe(last(BOSS_MOBS));
        expect(getMobForSkill({ id: 'math' }, { level: 10 }, LOW)).toBe(first(MINIBOSS_MOBS));
    });

    it('combat skill without stored mob picks a hostile mob', () => {
        expect(getMobForSkill({ id: 'reading' }, { level: 1 }, LOW)).toBe(first(HOSTILE_MOBS));
    });

    it('unknown skill with an invalid current mob picks the last hostile mob', () => {
        expect(getMobForSkill({ id: 'other' }, { level: 1, currentMob: 'Nope' }, HIGH)).toBe(last(HOSTILE_MOBS));
    });

    it('stored mobs are returned without reading the random source', () => {
        const random = () => {
            throw new Error('random should not be called');
        };
        expect(getMobForSkill({ id: 'math' }, { level: 1, mathMob: 'Boomer' }, random)).toBe('Boomer');
    });
});

describe('generateMathProblem with injected random', () => {
    it('difficulty 1 lower bound is 0 + 0', () => {
        expect(generateMathProblem(1, LOW)).toEqual({ type: 'math', question: '0 + 0 = ?', answer: '0' });
    });

    it('difficulty 1 upper bound is 9 + 9', () => {
        expect(generateMathProblem(1, HIGH)).toEqual({ type: 'math', question: '9 + 9 = ?', answer: '18' });
    });

    it('difficulty 3 subtraction upper bound is 20 - 20', () => {
        // op index 1 ('-'), a = 20, b = 20
        const problem = generateMathProblem(3, sequence([0.6, HIGH(), HIGH()]));
        expect(problem.question).toBe('20 - 20 = ?');
        expect(problem.answer).toBe('0');
    });

    it('difficulty 3 subtraction with b at its minimum', () => {
        const problem = generateMathProblem(3, sequence([0.6, HIGH(), 0]));
        expect(problem.question).toBe('20 - 1 = ?');
        expect(problem.answer).toBe('19');
    });

    // Known bug, kept as is (characterization). When a = 0, b = floor(random * 0) + 1 = 1,
    // so the answer is -1. This test pins the bug so a fix shows up as a deliberate change.
    it('KNOWN BUG: subtraction gives -1 when a is 0', () => {
        const problem = generateMathProblem(3, sequence([0.6, 0, 0]));
        expect(problem.question).toBe('0 - 1 = ?');
        expect(problem.answer).toBe('-1');
    });

    it('subtraction is never negative when a is at least 1', () => {
        for (let r = 0.05; r < 1; r += 0.05) {
            const problem = generateMathProblem(3, sequence([0.6, r, r]));
            const [a] = problem.question.split(' ');
            expect(Number(a)).toBeGreaterThanOrEqual(1);
            expect(Number(problem.answer)).toBeGreaterThanOrEqual(0);
        }
    });

    it('difficulty 4 multiplication uses multiplyRange bounds', () => {
        const [min, max] = DIFFICULTY_CONTENT.math[4].multiplyRange;
        expect(generateMathProblem(4, sequence([HIGH(), 0, 0])).question).toBe(`${min} × ${min} = ?`);
        expect(generateMathProblem(4, HIGH).answer).toBe(String(max * max));
    });

    it('difficulty 5 division is always clean at both bounds', () => {
        const [min, max] = DIFFICULTY_CONTENT.math[5].divisionRange;
        const low = generateMathProblem(5, sequence([HIGH(), 0, 0]));
        expect(low.question).toBe(`${min} ÷ ${min} = ?`);
        expect(low.answer).toBe('1');
        const high = generateMathProblem(5, HIGH);
        expect(high.question).toBe(`${max * 10} ÷ ${max} = ?`);
        expect(high.answer).toBe('10');
    });

    it('difficulty 6 picks first and last PEMDAS problem', () => {
        expect(generateMathProblem(6, LOW)).toMatchObject({ question: '3 + 4 × 2 = ?', answer: '11', isPemdas: true });
        expect(generateMathProblem(6, HIGH)).toMatchObject({ question: '4 × 2 - 1 = ?', answer: '7' });
    });

    it('difficulty 7 picks first and last nightmare problem', () => {
        expect(generateMathProblem(7, LOW).answer).toBe('32');
        expect(generateMathProblem(7, HIGH).answer).toBe('155');
    });

    it('same source gives the same problem', () => {
        const values = [0.3, 0.7, 0.2];
        expect(generateMathProblem(5, sequence(values))).toEqual(generateMathProblem(5, sequence(values)));
    });
});

describe('word pickers with injected random', () => {
    it('getReadingWord picks first and last word of the length pool', () => {
        const words = READING_WORDS[DIFFICULTY_CONTENT.reading[1].charLength];
        expect(getReadingWord(1, LOW)).toBe(words[0]);
        expect(getReadingWord(1, HIGH)).toBe(words.at(-1));
    });

    it('getReadingWord difficulty 7 uses funny long words', () => {
        expect(getReadingWord(7, LOW)).toBe(FUNNY_LONG_WORDS[0]);
        expect(getReadingWord(7, HIGH)).toBe(FUNNY_LONG_WORDS.at(-1));
    });

    it('getWordForDifficulty picks first and last item of the pool', () => {
        const pool = WRITING_DIFFICULTY_POOLS[2];
        expect(getWordForDifficulty(2, LOW).word).toBe(pool[0].word.toUpperCase());
        expect(getWordForDifficulty(2, HIGH).word).toBe(pool.at(-1).word.toUpperCase());
    });

    it('getWordForDifficulty falls back to pool 1 for an unknown difficulty', () => {
        expect(getWordForDifficulty(0, LOW).word).toBe(WRITING_DIFFICULTY_POOLS[1][0].word.toUpperCase());
    });
});
