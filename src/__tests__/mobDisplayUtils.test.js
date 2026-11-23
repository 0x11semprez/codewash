import { describe, it, expect } from 'vitest';
import { getRandomAura, AURA_ADJECTIVES } from '../utils/mobDisplayUtils';

describe('getRandomAura', () => {
  const validTypes = ['rainbow', 'frost', 'shadow', 'lava', 'gradient', 'sparkle', 'plasma', 'nature'];

  it('returns a valid aura type', () => {
    for (let i = 0; i < 50; i++) {
      expect(validTypes).toContain(getRandomAura());
    }
  });
});

describe('AURA_ADJECTIVES', () => {
  it('maps all 8 aura types', () => {
    expect(Object.keys(AURA_ADJECTIVES)).toHaveLength(8);
  });

  it('contains expected mappings', () => {
    expect(AURA_ADJECTIVES.frost).toBe('Frozen');
    expect(AURA_ADJECTIVES.lava).toBe('Flaming');
    expect(AURA_ADJECTIVES.shadow).toBe('Shadowy');
    expect(AURA_ADJECTIVES.rainbow).toBe('Prismatic');
    expect(AURA_ADJECTIVES.gradient).toBe('Shifting');
    expect(AURA_ADJECTIVES.sparkle).toBe('Glittering');
    expect(AURA_ADJECTIVES.plasma).toBe('Volatile');
    expect(AURA_ADJECTIVES.nature).toBe('Overgrown');
  });
});
