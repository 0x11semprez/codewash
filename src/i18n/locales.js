import { DEFAULT_LOCALE, resolveLocale } from './translate';
import { readJSON } from '../services/storage';
import { STORAGE_KEYS } from '../services/storageKeys';

// Every file in ./locales is a language. Adding a language means adding one
// file there: Vite picks it up at build time, nothing else needs to change.
const modules = import.meta.glob('./locales/*.js', { eager: true });

export const LOCALES = Object.fromEntries(
    Object.values(modules)
        .map((module) => module.default)
        .filter((locale) => locale && typeof locale.code === 'string' && locale.messages)
        .map((locale) => [locale.code, locale]),
);

// Sort order of the language menu: default language first, then the others in alphabetical order of their code.
export const compareLanguages = (a, b) =>
    a.code === DEFAULT_LOCALE ? -1 : b.code === DEFAULT_LOCALE ? 1 : a.code.localeCompare(b.code);

export const LANGUAGES = Object.values(LOCALES)
    .map(({ code, name }) => ({ code, name }))
    .sort(compareLanguages);

export const LANGUAGE_CODES = LANGUAGES.map(({ code }) => code);

export const LANGUAGE_STORAGE_KEY = STORAGE_KEYS.language;

const browserLanguages = () => {
    if (typeof navigator === 'undefined') return [];
    return navigator.languages?.length ? navigator.languages : [navigator.language];
};

// Saved choice first, then the browser language, then English.
export const getInitialLanguage = () =>
    resolveLocale(readJSON(LANGUAGE_STORAGE_KEY, null), browserLanguages(), LANGUAGE_CODES);
