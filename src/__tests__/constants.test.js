import { describe, it, expect } from 'vitest';
import {
  HOSTILE_MOBS, FRIENDLY_MOBS, BOSS_MOBS, MINIBOSS_MOBS,
  CHEST_BLOCKS, SPECIAL_CHESTS, MOB_KEYS,
  THEME_CONFIG, THEMES_LIST,
  READING_WORDS, FUNNY_LONG_WORDS,
  DIFFICULTY_CONTENT,
} from '../constants/gameData';
import { ACHIEVEMENTS, TIER_COLORS, TIER_NAMES } from '../constants/achievements';

describe('mobs constants', () => {
  it('HOSTILE_MOBS has 20 entries', () => {
    expect(Object.keys(HOSTILE_MOBS)).toHaveLength(20);
  });

  it('FRIENDLY_MOBS has entries', () => {
    expect(Object.keys(FRIENDLY_MOBS).length).toBeGreaterThan(0);
  });

  it('BOSS_MOBS has 4 entries', () => {
    expect(Object.keys(BOSS_MOBS)).toHaveLength(4);
  });

  it('MINIBOSS_MOBS has 4 entries', () => {
    expect(Object.keys(MINIBOSS_MOBS)).toHaveLength(4);
  });

  it('SPECIAL_CHESTS are subset of CHEST_BLOCKS', () => {
    SPECIAL_CHESTS.forEach(chest => {
      expect(CHEST_BLOCKS).toHaveProperty(chest);
    });
  });

  it('MOB_KEYS matches HOSTILE_MOBS keys', () => {
    expect(MOB_KEYS).toEqual(Object.keys(HOSTILE_MOBS));
  });

  it('all mob paths are strings starting with assets/', () => {
    const allMobs = { ...HOSTILE_MOBS, ...FRIENDLY_MOBS, ...BOSS_MOBS, ...MINIBOSS_MOBS };
    Object.values(allMobs).forEach(path => {
      expect(typeof path).toBe('string');
      expect(path.startsWith('assets/')).toBe(true);
    });
  });
});

describe('achievements constants', () => {
  it('ACHIEVEMENTS has entries', () => {
    expect(Object.keys(ACHIEVEMENTS).length).toBeGreaterThan(0);
  });

  it('every achievement has required fields', () => {
    Object.values(ACHIEVEMENTS).forEach(ach => {
      expect(ach).toHaveProperty('id');
      expect(ach).toHaveProperty('name');
      expect(ach).toHaveProperty('description');
      expect(ach).toHaveProperty('icon');
      expect(ach).toHaveProperty('category');
      expect(typeof ach.isTiered).toBe('boolean');
    });
  });

  it('tiered achievements have tiers and getProgress', () => {
    Object.values(ACHIEVEMENTS)
      .filter(a => a.isTiered)
      .forEach(ach => {
        expect(Array.isArray(ach.tiers)).toBe(true);
        expect(ach.tiers.length).toBeGreaterThan(0);
        expect(typeof ach.getProgress).toBe('function');
      });
  });

  it('one-time achievements have checkUnlock', () => {
    Object.values(ACHIEVEMENTS)
      .filter(a => !a.isTiered)
      .forEach(ach => {
        expect(typeof ach.checkUnlock).toBe('function');
      });
  });

  it('TIER_COLORS has 8 tiers', () => {
    expect(Object.keys(TIER_COLORS)).toHaveLength(8);
  });

  it('TIER_NAMES has 8 names', () => {
    expect(TIER_NAMES).toHaveLength(8);
  });
});

describe('themes constants', () => {
  it('THEME_CONFIG has entries', () => {
    expect(Object.keys(THEME_CONFIG).length).toBeGreaterThan(0);
  });

  it('every theme has name, style, assets, skills', () => {
    Object.values(THEME_CONFIG).forEach(theme => {
      expect(theme).toHaveProperty('name');
      expect(theme).toHaveProperty('style');
      expect(theme).toHaveProperty('assets');
      expect(theme).toHaveProperty('skills');
    });
  });

  it('THEMES_LIST ids match THEME_CONFIG keys', () => {
    THEMES_LIST.forEach(item => {
      expect(THEME_CONFIG).toHaveProperty(item.id);
    });
  });

  it('every theme has 6 skills', () => {
    Object.values(THEME_CONFIG).forEach(theme => {
      expect(Object.keys(theme.skills)).toHaveLength(6);
    });
  });
});

describe('words constants', () => {
  it('READING_WORDS has word lists for lengths 3-8', () => {
    [3, 4, 5, 6, 7, 8].forEach(len => {
      expect(READING_WORDS[len]).toBeDefined();
      expect(READING_WORDS[len].length).toBeGreaterThan(0);
    });
  });

  it('all reading words are uppercase', () => {
    Object.values(READING_WORDS).forEach(words => {
      words.forEach(word => {
        expect(word).toBe(word.toUpperCase());
      });
    });
  });

  it('FUNNY_LONG_WORDS are all uppercase and long', () => {
    FUNNY_LONG_WORDS.forEach(word => {
      expect(word).toBe(word.toUpperCase());
      expect(word.length).toBeGreaterThan(10);
    });
  });
});

describe('difficulty content', () => {
  it('reading has 7 difficulty levels', () => {
    expect(Object.keys(DIFFICULTY_CONTENT.reading)).toHaveLength(7);
  });

  it('math has 7 difficulty levels', () => {
    expect(Object.keys(DIFFICULTY_CONTENT.math)).toHaveLength(7);
  });

  it('math difficulty 7 is nightmare', () => {
    expect(DIFFICULTY_CONTENT.math[7].nightmare).toBe(true);
  });

  it('math difficulty 6 is pemdas', () => {
    expect(DIFFICULTY_CONTENT.math[6].pemdas).toBe(true);
  });

  it('memory pairs increase with difficulty', () => {
    for (let d = 1; d < 7; d++) {
      expect(DIFFICULTY_CONTENT.memory[d + 1].pairs).toBeGreaterThanOrEqual(DIFFICULTY_CONTENT.memory[d].pairs);
    }
  });
});
