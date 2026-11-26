import { createContext } from 'react';
import { DEFAULT_LOCALE, createMissingKeyWarner, createTranslator } from './translate';
import { LANGUAGES, LOCALES } from './locales';

// Warn about missing keys only in development builds and tests.
export const devMissingKeyWarner = import.meta.env.DEV ? createMissingKeyWarner() : undefined;

// Default value: English, so a component rendered without the provider
// (for example in a unit test) still shows its English text.
export const I18nContext = createContext({
    language: DEFAULT_LOCALE,
    languages: LANGUAGES,
    setLanguage: () => {},
    t: createTranslator(DEFAULT_LOCALE, LOCALES, { onMissing: devMissingKeyWarner }),
});
