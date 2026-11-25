// Small helpers around a random source.
// Every helper takes the source as its last argument and defaults to Math.random,
// so game code stays the same and tests can pass a fixed source.

// Integer in [0, n). Same as Math.floor(random() * n).
export const randomInt = (n, random = Math.random) => Math.floor(random() * n);

// Integer in [min, max], both ends included.
export const randomIntBetween = (min, max, random = Math.random) => randomInt(max - min + 1, random) + min;

// One element of a non-empty array.
export const pickRandom = (items, random = Math.random) => items[randomInt(items.length, random)];
