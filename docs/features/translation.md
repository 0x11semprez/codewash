# Translation

## Overview

The game is available in English and French. English is the default language.

Players change the language in the settings drawer (the gear button, top left). The "Language" section at the top has a button that shows the current language. Click it to open the list, then pick a language. All the text changes at once.

The choice is saved in the browser. On the first visit, the game uses the browser language if it is supported. Otherwise it uses English.

The design and its limits are explained in [ADR-012](../adr/012-translation.md).

## Where the code is

| File | Role |
| --- | --- |
| `src/i18n/locales/en.js` | English text. It is the reference and the fallback. |
| `src/i18n/locales/fr.js` | French text. It has the same keys as English. |
| `src/i18n/locales.js` | Finds every language file and reads the saved or browser language. |
| `src/i18n/translate.js` | Pure functions: key lookup, placeholders, plurals, fallback. |
| `src/i18n/I18nProvider.jsx` | Holds the current language, saves it, and sets `<html lang>`. |
| `src/i18n/useTranslation.js` | The hook that components use. |
| `src/i18n/gameText.js` | Helpers for achievement, skill and mob text. |
| `src/components/ui/LanguageSelector.jsx` | The language button and list. |

## How to add a language

1. Copy `src/i18n/locales/en.js` to a new file named after the language code, for example `src/i18n/locales/es.js`.
2. Set `code` to the same code (`'es'`).
3. Set `name` to the language name, written in that language (`'Español'`).
4. Translate every value in `messages`. Do not rename or remove keys.
5. Keep every placeholder such as `{{level}}` exactly as it is. You can move it inside the sentence.
6. Run the tests (see below).

You do not need to change any other file. The new language appears in the selector by itself.

If a key is missing in the new file, the game shows the English text and logs a warning in development. The tests fail until the file is complete.

## How to add a string

1. Pick a key in the group of the screen, for example `settings.musicVolume`.
2. Add it to `en.js` and to every other language file.
3. In a function component, read it with the hook:

   ```jsx
   import { useTranslation } from '../../i18n/useTranslation';

   const MyPanel = ({ level }) => {
       const { t } = useTranslation();
       return <h2>{t('menu.level', { level })}</h2>;
   };
   ```

4. In a class component, read the context:

   ```jsx
   import { I18nContext } from '../../i18n/I18nContext';

   class MyBoundary extends React.Component {
       static contextType = I18nContext;
       render() {
           return <p>{this.context.t('errors.title')}</p>;
       }
   }
   ```

### Placeholders

Write `{{name}}` in the text and pass `{ name: value }` to `t`:

```js
t('loot.levelReached', { level: 20 }); // "LEVEL 20 REACHED!"
```

### Plurals

Add two keys, `key_one` and `key_other`, and pass a number as `count`:

```js
// en.js
failed_one: '{{count}} CRITICAL IMAGE COULD NOT LOAD.',
failed_other: '{{count}} CRITICAL IMAGES COULD NOT LOAD.',

// component
t('loading.failed', { count: failedCount });
```

The form is chosen with `Intl.PluralRules`, so each language follows its own rules. In French, 0 uses the `_one` form.

### Game data

Achievements, skills, badges, border effects and auras keep their ids in the constants. Their text lives in the dictionaries under the same id:

- `achievements.<id>.name`, `achievements.<id>.description`, `achievements.<id>.tiers.<index>`
- `skills.<id>.name`, `fantasyName`, `actionName`, `taskDescription`
- `badges.<title>`, `borders.<id>.name`, `borders.<id>.description`, `auras.<aura>`

When you add an achievement, a skill, a badge or an aura, add its text to the dictionaries too. A test checks this.

## What is not translated

- Creature names. Saves and achievements use them as ids, and the spelling game uses them as words.

Theme names, skill texts per theme and pattern piece labels are translated in each theme's JSON file, in a `"translations"` block. See [the themes guide](themes.md#7-translate-the-theme-optional). When a theme has no translation for a language, the game shows the theme's own text, then the dictionary text.
- The loading screen wordmark.
- Network error details in the bug report form. They come from the browser and stay in its language.
- The reading words, writing words and math problems. They are game data. See ADR-012 for the reasons.

## How to test

Run the i18n tests:

```sh
npx vitest run src/__tests__/i18n
```

They check:

- `translate.test.js`: key lookup, placeholders, plurals, the English fallback, missing keys and the browser language.
- `locales.test.js`: every language has the same keys and placeholders as English, and English covers all game data ids.
- `I18nProvider.test.jsx`: the saved choice, the browser default, `<html lang>`, and the selector switching the text of another component.
- `translatedScreens.test.jsx`: the main screens rendered in French.

Run the full suite before a merge:

```sh
npx vitest run --dir src
npm run lint
npm run format:check
```

### Manual check

- [ ] Open the settings drawer and switch to Français. The drawer, the skill cards and the title change.
- [ ] Reload the page. The game stays in French.
- [ ] Open the achievements drawer. Names, descriptions and tiers are in French.
- [ ] Open "Effacer la progression". The modal asks you to type EFFACER.
- [ ] Clear the site data and set the browser to French. The game starts in French.
- [ ] In the dev tools, check that `<html lang>` follows the selected language.
