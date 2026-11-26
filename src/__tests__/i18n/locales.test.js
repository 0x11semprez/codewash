import { describe, it, expect, vi, afterEach } from 'vitest';
import { LANGUAGES, LANGUAGE_CODES, LOCALES, compareLanguages, getInitialLanguage } from '../../i18n/locales';
import { createMemoryStorage } from '../helpers/memoryStorage';
import { DEFAULT_LOCALE, flattenKeys, lookup } from '../../i18n/translate';
import { ACHIEVEMENTS, TIER_NAMES } from '../../constants/achievements';
import { BADGE_TIERS, SKILL_DATA, THEME_CONFIG } from '../../constants/gameData';
import { AURA_ADJECTIVES } from '../../utils/mobDisplayUtils';

const en = LOCALES.en.messages;
const placeholders = (text) => (text.match(/\{\{\s*\w+\s*\}\}/g) || []).map((p) => p.replace(/\s/g, '')).sort();

describe('language registry', () => {
    it('finds English and French, with English first', () => {
        expect(LANGUAGE_CODES[0]).toBe(DEFAULT_LOCALE);
        expect(LANGUAGE_CODES).toEqual(expect.arrayContaining(['en', 'fr']));
        expect(LANGUAGES.find((l) => l.code === 'fr').name).toBe('Français');
    });

    it('puts the default language first and sorts the others by code', () => {
        const codes = ['fr', 'de', DEFAULT_LOCALE, 'es'].map((code) => ({ code }));
        expect(codes.sort(compareLanguages).map(({ code }) => code)).toEqual([DEFAULT_LOCALE, 'de', 'es', 'fr']);
    });

    it('gives every language a code that matches its key and a name', () => {
        Object.entries(LOCALES).forEach(([code, locale]) => {
            expect(locale.code).toBe(code);
            expect(typeof locale.name).toBe('string');
            expect(locale.name.length).toBeGreaterThan(0);
        });
    });
});

describe.each(Object.keys(LOCALES).filter((code) => code !== DEFAULT_LOCALE))('dictionary "%s"', (code) => {
    const messages = LOCALES[code].messages;
    const enKeys = flattenKeys(en).sort();
    const keys = flattenKeys(messages).sort();

    it('has every English key', () => {
        expect(enKeys.filter((key) => !keys.includes(key))).toEqual([]);
    });

    it('has no key that English does not have', () => {
        expect(keys.filter((key) => !enKeys.includes(key))).toEqual([]);
    });

    it('keeps the same placeholders as English and no empty text', () => {
        enKeys.forEach((key) => {
            const text = lookup(messages, key);
            expect(typeof text, key).toBe('string');
            expect(text.trim().length, key).toBeGreaterThan(0);
            expect(placeholders(text), key).toEqual(placeholders(lookup(en, key)));
        });
    });
});

// The English dictionary must cover every id used by the game data,
// so a new achievement or skill without text fails here.
describe('English dictionary covers the game data', () => {
    it('has a name and description for every achievement, and every tier name', () => {
        Object.values(ACHIEVEMENTS).forEach((achievement) => {
            expect(lookup(en, `achievements.${achievement.id}.name`)).toBe(achievement.name);
            expect(lookup(en, `achievements.${achievement.id}.description`)).toBe(achievement.description);
            (achievement.tiers || []).forEach((tier, index) => {
                expect(lookup(en, `achievements.${achievement.id}.tiers.${index}`)).toBe(tier.tierName);
            });
        });
        TIER_NAMES.forEach((name, index) => expect(lookup(en, `tiers.${index}`)).toBe(name));
    });

    it('has the visible text of every skill', () => {
        SKILL_DATA.forEach((skill) => {
            ['name', 'fantasyName', 'actionName', 'taskDescription'].forEach((field) => {
                expect(lookup(en, `skills.${skill.id}.${field}`)).toBe(skill[field]);
            });
        });
    });

    it('has a translation of the name and skill texts of every theme', () => {
        const others = LANGUAGE_CODES.filter((code) => code !== DEFAULT_LOCALE);
        Object.values(THEME_CONFIG).forEach((theme) => {
            others.forEach((code) => {
                const text = theme.translations[code];
                expect(text?.name, `${theme.id} ${code} name`).toBeTruthy();
                SKILL_DATA.forEach((skill) => {
                    ['name', 'fantasyName', 'actionName', 'taskDescription'].forEach((field) => {
                        expect(text.skills[skill.id]?.[field], `${theme.id} ${code} ${skill.id}.${field}`).toBeTruthy();
                    });
                });
                if (theme.ownPatternPieces) {
                    Object.keys(theme.patternPieces).forEach((piece) => {
                        expect(text.patternPieces[piece], `${theme.id} ${code} ${piece}`).toBeTruthy();
                    });
                }
            });
        });
    });

    it('has every badge title and aura adjective', () => {
        BADGE_TIERS.forEach(({ title }) => expect(lookup(en, `badges.${title}`)).toBe(title));
        Object.entries(AURA_ADJECTIVES).forEach(([aura, adjective]) => {
            expect(lookup(en, `auras.${aura}`)).toBe(adjective);
        });
    });
});

describe('getInitialLanguage', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('uses navigator.language when the browser gives no language list', () => {
        vi.stubGlobal('localStorage', createMemoryStorage());
        vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue([]);
        vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('fr-FR');
        expect(getInitialLanguage()).toBe('fr');
    });

    it('falls back to English when there is no navigator', () => {
        vi.stubGlobal('localStorage', createMemoryStorage());
        vi.stubGlobal('navigator', undefined);
        expect(getInitialLanguage()).toBe(DEFAULT_LOCALE);
    });
});
