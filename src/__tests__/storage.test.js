import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMemoryStorage } from './helpers/memoryStorage';
import { parseJSON, readJSON, writeJSON, backupCorrupted } from '../services/storage';

describe('storage helpers', () => {
    let warn;
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
        warn.mockRestore();
        vi.unstubAllGlobals();
    });

    it('readJSON returns the parsed value for valid JSON without warning', () => {
        localStorage.setItem('k', JSON.stringify({ 1: 'Ana' }));
        expect(readJSON('k', {})).toEqual({ 1: 'Ana' });
        expect(warn).not.toHaveBeenCalled();
    });

    it('readJSON returns the fallback quietly when the key is missing', () => {
        const fallback = { a: 1 };
        expect(readJSON('missing', fallback)).toBe(fallback);
        expect(warn).not.toHaveBeenCalled();
    });

    it('readJSON returns the fallback and warns on invalid JSON', () => {
        localStorage.setItem('k', '{not json');
        expect(readJSON('k', { a: 1 })).toEqual({ a: 1 });
        expect(warn).toHaveBeenCalledTimes(1);
    });

    it.each([['null'], ['42'], ['"text"'], ['[1,2]']])('readJSON rejects %s when an object is expected', (raw) => {
        localStorage.setItem('k', raw);
        expect(readJSON('k', { a: 1 })).toEqual({ a: 1 });
        expect(warn).toHaveBeenCalledTimes(1);
    });

    it('readJSON returns the fallback when localStorage throws', () => {
        localStorage.getItem = () => {
            throw new Error('denied');
        };
        expect(readJSON('k', 'fb')).toBe('fb');
        expect(warn).toHaveBeenCalledTimes(1);
    });

    it('parseJSON accepts any type when the fallback is null', () => {
        expect(parseJSON('[1]', null)).toEqual([1]);
        expect(parseJSON(null, null)).toBeNull();
    });

    it('backupCorrupted copies the raw value once and never overwrites the first backup', () => {
        expect(backupCorrupted('save', 'first')).toBe('save_corrupted_backup');
        backupCorrupted('save', 'second');
        expect(localStorage.getItem('save_corrupted_backup')).toBe('first');
    });

    it('writeJSON saves a JSON value and returns true', () => {
        expect(writeJSON('lang', 'fr')).toBe(true);
        expect(localStorage.getItem('lang')).toBe('"fr"');
        expect(readJSON('lang', 'en')).toBe('fr');
    });

    it('writeJSON returns false and warns when storage throws', () => {
        vi.stubGlobal('localStorage', {
            setItem: () => {
                throw new Error('full');
            },
        });
        expect(writeJSON('lang', 'fr')).toBe(false);
        expect(warn).toHaveBeenCalled();
    });
});
