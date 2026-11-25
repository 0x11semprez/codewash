// In-memory localStorage replacement: the jsdom one is shadowed by Node's own global in recent Node versions.
export const createMemoryStorage = () => {
    const store = {};
    return {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => {
            store[k] = String(v);
        },
        removeItem: (k) => {
            delete store[k];
        },
        clear: () => {
            Object.keys(store).forEach((k) => delete store[k]);
        },
    };
};
