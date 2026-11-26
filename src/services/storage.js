// Safe helpers for JSON values kept in localStorage.
// A missing value returns the fallback quietly; a corrupted one (invalid JSON,
// or a type that does not match the fallback) returns the fallback and warns.

const kindOf = (value) => (value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value);

export const parseJSON = (raw, fallback, label = 'value') => {
    if (raw === null || raw === undefined) return fallback;
    try {
        const parsed = JSON.parse(raw);
        if (fallback !== null && fallback !== undefined && kindOf(parsed) !== kindOf(fallback)) {
            throw new TypeError(`expected ${kindOf(fallback)}, got ${kindOf(parsed)}`);
        }
        return parsed;
    } catch (error) {
        console.warn(`[storage] Ignoring corrupted ${label}:`, error);
        return fallback;
    }
};

export const readJSON = (key, fallback) => {
    let raw;
    try {
        raw = localStorage.getItem(key);
    } catch (error) {
        console.warn(`[storage] Cannot read "${key}":`, error);
        return fallback;
    }
    return parseJSON(raw, fallback, `"${key}"`);
};

// Copies a corrupted raw value aside once, so the next save does not destroy it.
export const backupCorrupted = (key, raw) => {
    const backupKey = `${key}_corrupted_backup`;
    try {
        if (localStorage.getItem(backupKey) === null) {
            localStorage.setItem(backupKey, raw);
            console.warn(`[storage] Corrupted "${key}" backed up to "${backupKey}".`);
        }
    } catch (error) {
        console.warn(`[storage] Cannot back up "${key}":`, error);
    }
    return backupKey;
};
