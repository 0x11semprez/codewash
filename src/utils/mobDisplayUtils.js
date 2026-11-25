import { pickRandom } from './random';

// Mob display utilities for aura generation

// Available aura types
const AURA_TYPES = ['rainbow', 'frost', 'shadow', 'lava', 'gradient', 'sparkle', 'plasma', 'nature'];

// Aura adjectives mapping
export const AURA_ADJECTIVES = {
    frost: 'Frozen',
    lava: 'Flaming',
    shadow: 'Shadowy',
    rainbow: 'Prismatic',
    gradient: 'Shifting',
    sparkle: 'Glittering',
    plasma: 'Volatile',
    nature: 'Overgrown',
};

/**
 * Get a random aura effect
 * @param {() => number} [random=Math.random] Source of numbers in [0, 1)
 * @returns {string} Random aura type from AURA_TYPES
 */
export const getRandomAura = (random = Math.random) => {
    return pickRandom(AURA_TYPES, random);
};
