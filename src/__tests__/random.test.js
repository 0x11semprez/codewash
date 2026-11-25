import { describe, it, expect } from 'vitest';
import { randomInt, randomIntBetween, pickRandom } from '../utils/random';
import { now, toDateKey, today } from '../utils/clock';

const LOW = () => 0;
const HIGH = () => 0.999999;

describe('random helpers', () => {
    it('randomInt covers [0, n) at both ends', () => {
        expect(randomInt(5, LOW)).toBe(0);
        expect(randomInt(5, HIGH)).toBe(4);
    });

    it('randomIntBetween includes both bounds', () => {
        expect(randomIntBetween(3, 7, LOW)).toBe(3);
        expect(randomIntBetween(3, 7, HIGH)).toBe(7);
    });

    it('pickRandom returns first and last element', () => {
        expect(pickRandom(['a', 'b', 'c'], LOW)).toBe('a');
        expect(pickRandom(['a', 'b', 'c'], HIGH)).toBe('c');
    });

    it('defaults to Math.random', () => {
        for (let i = 0; i < 50; i++) {
            const value = randomIntBetween(1, 3);
            expect(value).toBeGreaterThanOrEqual(1);
            expect(value).toBeLessThanOrEqual(3);
        }
    });
});

describe('clock helpers', () => {
    it('toDateKey formats a UTC day', () => {
        expect(toDateKey(Date.UTC(2026, 10, 25, 23, 59))).toBe('2026-11-25');
    });

    it('today uses the injected clock', () => {
        expect(today(() => Date.UTC(2024, 1, 29, 12))).toBe('2024-02-29');
    });

    it('now and today default to the system clock', () => {
        const before = Date.now();
        expect(now()).toBeGreaterThanOrEqual(before);
        expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});
