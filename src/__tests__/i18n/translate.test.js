import { describe, it, expect, vi } from 'vitest';
import {
    createMissingKeyWarner,
    createTranslator,
    flattenKeys,
    interpolate,
    lookup,
    resolveLocale,
} from '../../i18n/translate';

const dictionaries = {
    en: {
        code: 'en',
        name: 'English',
        messages: {
            greeting: 'Hello {{name}}!',
            menu: { title: 'Menu' },
            onlyEnglish: 'Only in English',
            apples_one: '{{count}} apple',
            apples_other: '{{count}} apples',
        },
    },
    fr: {
        code: 'fr',
        name: 'Français',
        messages: {
            greeting: 'Bonjour {{name}} !',
            menu: { title: 'Menu FR' },
            apples_one: '{{count}} pomme',
            apples_other: '{{count}} pommes',
        },
    },
};

describe('lookup', () => {
    it('reads nested keys with dots', () => {
        expect(lookup(dictionaries.en.messages, 'menu.title')).toBe('Menu');
    });

    it('returns undefined for a missing path, a branch, or bad input', () => {
        expect(lookup(dictionaries.en.messages, 'menu.nothing')).toBeUndefined();
        expect(lookup(dictionaries.en.messages, 'greeting.deeper')).toBeUndefined();
        expect(lookup(dictionaries.en.messages, 'menu')).toBeUndefined();
        expect(lookup(undefined, 'menu.title')).toBeUndefined();
        expect(lookup(dictionaries.en.messages, 42)).toBeUndefined();
    });
});

describe('interpolate', () => {
    it('replaces placeholders, with or without spaces', () => {
        expect(interpolate('{{a}} and {{ b }}', { a: 1, b: 'two' })).toBe('1 and two');
    });

    it('keeps unknown placeholders and returns text unchanged without params', () => {
        expect(interpolate('Hi {{who}}', { other: 1 })).toBe('Hi {{who}}');
        expect(interpolate('Hi {{who}}')).toBe('Hi {{who}}');
    });

    it('accepts zero and empty values', () => {
        expect(interpolate('{{n}}|{{s}}', { n: 0, s: '' })).toBe('0|');
    });
});

describe('createTranslator', () => {
    it('translates and interpolates in the current language', () => {
        const t = createTranslator('fr', dictionaries);
        expect(t('greeting', { name: 'Ana' })).toBe('Bonjour Ana !');
        expect(t('menu.title')).toBe('Menu FR');
    });

    it('falls back to English and reports it', () => {
        const onMissing = vi.fn();
        const t = createTranslator('fr', dictionaries, { onMissing });
        expect(t('onlyEnglish')).toBe('Only in English');
        expect(onMissing).toHaveBeenCalledWith('fallback', 'fr', 'onlyEnglish');
    });

    it('returns the key itself for a key missing everywhere and reports it', () => {
        const onMissing = vi.fn();
        expect(createTranslator('fr', dictionaries, { onMissing })('nope.key')).toBe('nope.key');
        expect(onMissing).toHaveBeenCalledWith('missing', 'fr', 'nope.key');
        expect(createTranslator('en', dictionaries, { onMissing })('nope.key')).toBe('nope.key');
        expect(onMissing).toHaveBeenLastCalledWith('missing', 'en', 'nope.key');
    });

    it('works without an onMissing callback and for an unknown language', () => {
        const t = createTranslator('xx', dictionaries);
        expect(t('menu.title')).toBe('Menu');
        expect(t('nope')).toBe('nope');
    });

    it('picks plural forms from params.count', () => {
        const en = createTranslator('en', dictionaries);
        expect(en('apples', { count: 1 })).toBe('1 apple');
        expect(en('apples', { count: 3 })).toBe('3 apples');
        const fr = createTranslator('fr', dictionaries);
        expect(fr('apples', { count: 0 })).toBe('0 pomme');
        expect(fr('apples', { count: 2 })).toBe('2 pommes');
    });

    it('uses the _other form when the exact plural form is missing', () => {
        const dicts = { en: { messages: { cats_other: '{{count}} cats' } } };
        expect(createTranslator('en', dicts)('cats', { count: 1 })).toBe('1 cats');
    });

    it('uses _other when the language code is not valid for Intl', () => {
        const dicts = { 'not a locale!': { messages: { dogs_other: '{{count}} dogs' } } };
        expect(createTranslator('not a locale!', dicts)('dogs', { count: 1 })).toBe('1 dogs');
    });
});

describe('createMissingKeyWarner', () => {
    it('warns once per kind, language and key', () => {
        const log = vi.fn();
        const warn = createMissingKeyWarner(log);
        warn('missing', 'fr', 'a');
        warn('missing', 'fr', 'a');
        warn('fallback', 'fr', 'a');
        expect(log).toHaveBeenCalledTimes(2);
        expect(log.mock.calls[0][0]).toContain('Missing key "a"');
        expect(log.mock.calls[1][0]).toContain('not translated in "fr"');
    });
});

describe('resolveLocale', () => {
    const available = ['en', 'fr'];

    it('prefers a saved supported language', () => {
        expect(resolveLocale('fr', ['en-US'], available)).toBe('fr');
    });

    it('uses the browser language, exact or by base code', () => {
        expect(resolveLocale(null, ['fr-CA'], available)).toBe('fr');
        expect(resolveLocale(null, ['de-DE', 'FR'], available)).toBe('fr');
    });

    it('ignores unsupported saved values and bad browser entries', () => {
        expect(resolveLocale('xx', [undefined, 'de'], available)).toBe('en');
        expect(resolveLocale(42, undefined, available)).toBe('en');
    });
});

describe('flattenKeys', () => {
    it('lists leaf keys as dotted paths', () => {
        expect(flattenKeys({ a: 'x', b: { c: 'y', d: { e: 'z' } } })).toEqual(['a', 'b.c', 'b.d.e']);
    });
});
