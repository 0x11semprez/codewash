// Pure translation helpers. No React here, so every rule can be unit tested.

export const DEFAULT_LOCALE = 'en';

// Reads a dotted key such as "settings.title" from a nested dictionary.
export const lookup = (messages, key) => {
    if (!messages || typeof key !== 'string') return undefined;
    let node = messages;
    for (const part of key.split('.')) {
        if (node === null || typeof node !== 'object' || !(part in node)) return undefined;
        node = node[part];
    }
    return typeof node === 'string' ? node : undefined;
};

// Replaces {{name}} with params.name. Unknown placeholders stay visible.
export const interpolate = (text, params) => {
    if (!params) return text;
    return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
    );
};

// Lists every leaf key of a dictionary as dotted paths. Used by the parity test.
export const flattenKeys = (messages, prefix = '') =>
    Object.entries(messages).flatMap(([name, value]) => {
        const path = prefix ? `${prefix}.${name}` : name;
        return value !== null && typeof value === 'object' ? flattenKeys(value, path) : [path];
    });

// Picks the first supported language from a saved value, then the browser list.
export const resolveLocale = (saved, browserLanguages, available, fallback = DEFAULT_LOCALE) => {
    if (typeof saved === 'string' && available.includes(saved)) return saved;
    for (const tag of browserLanguages || []) {
        if (typeof tag !== 'string') continue;
        const lower = tag.toLowerCase();
        if (available.includes(lower)) return lower;
        const base = lower.split('-')[0];
        if (available.includes(base)) return base;
    }
    return fallback;
};

const pluralKey = (locale, key, count) => {
    try {
        return `${key}_${new Intl.PluralRules(locale).select(count)}`;
    } catch {
        return `${key}_other`;
    }
};

/**
 * Builds a t(key, params) function for one language.
 * Order: current language, then the fallback language, then the key itself.
 * With a numeric params.count, "key_one" / "key_other" are tried first.
 * onMissing(kind, locale, key) is called when a key is not in the current
 * language ("fallback") or not anywhere ("missing").
 */
export const createTranslator = (locale, dictionaries, { fallback = DEFAULT_LOCALE, onMissing } = {}) => {
    const current = dictionaries[locale]?.messages;
    const backup = dictionaries[fallback]?.messages;

    const find = (messages, lang, key, params) => {
        if (params && typeof params.count === 'number') {
            const plural = lookup(messages, pluralKey(lang, key, params.count)) ?? lookup(messages, `${key}_other`);
            if (plural !== undefined) return plural;
        }
        return lookup(messages, key);
    };

    return (key, params) => {
        let text = find(current, locale, key, params);
        if (text === undefined) {
            text = locale === fallback ? undefined : find(backup, fallback, key, params);
            if (onMissing) onMissing(text === undefined ? 'missing' : 'fallback', locale, key);
            if (text === undefined) return key;
        }
        return interpolate(text, params);
    };
};

// Warns once per language and key, so a re-render does not flood the console.
export const createMissingKeyWarner = (log = console.warn) => {
    const seen = new Set();
    return (kind, locale, key) => {
        const id = `${kind}:${locale}:${key}`;
        if (seen.has(id)) return;
        seen.add(id);
        log(
            kind === 'missing'
                ? `[i18n] Missing key "${key}" (language "${locale}").`
                : `[i18n] Key "${key}" is not translated in "${locale}", using English.`,
        );
    };
};
