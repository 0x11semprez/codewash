# ADR-012: Translation with a small in-house i18n module

## Status

Accepted

## Date

2026-11-26

## Context

The subject asks for a language button, a list of languages, and no hardcoded text.

Before this change, every visible string was written inside the components. Menus, drawers, modals, achievements, the loading screen, the error boundaries and the skill cards were all in English only. Some English text also lived in constants, such as achievement names and skill descriptions.

The game is a React 19 + Vite app that also ships as an Electron build. It has three runtime dependencies: `react`, `react-dom` and `lucide-react`. We need English (the current text) and French. Adding a language later must mean adding one file.

We compared two options:

- `react-i18next` with `i18next`. It is the common choice. It brings plurals, namespaces, lazy loading and many plugins. It also adds two runtime packages, their config, and an init step before the first render.
- A small module written for this project: a React context, a `useTranslation` hook, and plain JS dictionaries.

Our needs are small. We need key lookup, `{{name}}` placeholders, a fallback to English, a warning for missing keys, and simple plurals for one string. Two languages fit easily in the bundle, so lazy loading is not needed yet.

## Decision

We wrote our own module in `src/i18n/`, with no new dependency.

- `translate.js` holds pure functions: `lookup`, `interpolate`, `createTranslator`, `resolveLocale`, `flattenKeys` and `createMissingKeyWarner`. They do not use React, so tests can call them directly.
- `locales/en.js` and `locales/fr.js` are the dictionaries. Each file exports `{ code, name, messages }`. `name` is written in the language itself, for example "Français".
- `locales.js` loads every file in `locales/` with `import.meta.glob`. A new file there becomes a new language in the selector. No other code changes.
- `I18nProvider.jsx` keeps the current language in state. It saves the choice in `localStorage` under `language_v1` and sets `<html lang>`. On the first visit it reads `navigator.languages` and falls back to English.
- `useTranslation()` returns `{ t, language, languages, setLanguage }`. Class components (the two error boundaries) read the same context with `static contextType`.
- When a key is missing in French, `t` uses the English text. When a key is missing everywhere, `t` returns the key itself. In development and tests, both cases log one warning per key.
- A key with `_one` and `_other` forms is a plural. `t` picks the form with `Intl.PluralRules`.
- The context has an English default value. A component rendered without the provider still shows English, so the existing tests did not need a wrapper.
- `LanguageSelector` sits at the top of the settings drawer. It is a button that opens a list of languages. The button has `aria-expanded`, each language has `aria-pressed`, and each language name has its own `lang` attribute.
- The subject asks for a new input in the main menu. `LanguageMenuButton` is an icon button in the bottom left corner of the main screen, styled like the other corner buttons. It opens the same list of languages above it. Escape and a click outside close the list, and focus goes back to the button. The settings drawer keeps its `LanguageSelector`.

### What we translate

We moved 312 strings into the dictionaries. They cover the main screen, the settings, cosmetics and achievements drawers, the reset and parental modals, achievement names, descriptions and tiers, badges, border effects, the skill cards, the mini-game labels, the loading screen, the bug report form and the two error boundaries.

The two confirmation words follow the language. The reset modal asks for "DELETE" in English and "EFFACER" in French. The parental check expects "FLOPPY DISK" in English and "DISQUETTE" in French.

These stay as they are:

- Theme names and theme skill texts are not in the dictionaries. They are translated in each theme's JSON file (see ADR-013).
- Creature names (Zombie, Boomer, Void Dragon...). Save files and achievements use them as ids. Only the aura adjective is translated, and French puts it after the noun ("Zombie gelé").
- The "MINECRAFT / GAME STUDIOS" wordmark on the loading screen. It is a logo.
- The error detail in the bug report form when sending fails. It comes from the browser or the server.

### Educational content stays in English for now

The reading and writing words, the homophones and the math problems are game data. Translating them takes more than new strings:

- Speech recognition must listen in the matching language. While the words stay English, recognition stays `en-US` in every interface language (`READING_SPEECH_LANGUAGE` in `useVoiceRecognition.js`). A French recognizer would turn English words into French ones, and the exact match against the answer would fail.
- The homophone list (`SEE`, `SEA`, `C`) only makes sense in English.
- Word lengths drive the difficulty levels.
- The writing game builds the answer from the mob name, which stays in English.

So in French, the interface is French but the reading and writing exercises are still English words. Math is the same in both languages. This needs its own design work and a review by a teacher, so we will do it later.

## Consequences

### Positive

- No new runtime dependency. The module is about 200 lines, and the tests cover every line of it.
- Adding a language means adding one file in `src/i18n/locales/`. A test fails if that file misses an English key, has an extra key, or changes a placeholder.
- Another test checks that the English dictionary matches the ids in the game data. A new achievement, skill, badge or aura without text fails the test suite.
- The language is saved, follows the browser on the first visit, and sets `<html lang>` for screen readers.
- We added `aria-label` to the icon-only buttons (settings, cosmetics, achievements, bug report, carousel arrows, difficulty) while moving their text.

### Negative

- We maintain the module ourselves. If we need lazy loading, rich text inside a translation, or complex plural rules, `react-i18next` may become the better choice. The keys and dictionary shape are close to i18next's format, so a move later would be mostly mechanical.
- The constants still hold English names and descriptions (`ACHIEVEMENTS`, `SKILL_DATA`, `THEME_CONFIG`). Utilities and tests use them. The UI reads the dictionaries, and a test keeps the two in sync. Removing the copies from the constants is a follow-up.
- `useVoiceRecognition` stores its status messages as dictionary keys (`MIC_STATUS`) in the same `spokenText` state as the transcript. The reading game translates them with `t()`. A transcript has no dots, so it never matches a key.
- A toast that is already on screen keeps its language until it closes.
- Follow-ups: translate the educational content, and remove the English copies from the constants.
