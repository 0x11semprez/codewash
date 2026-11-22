import { describe, it, expect } from 'vitest';
import {
  getDefaultStats,
  isAchievementUnlocked,
  getCurrentTier,
  getNextTier,
  getTierProgress,
  getNewlyUnlockedAchievements,
  getNewTierAchievements,
  addUniqueToArray,
  getAchievementDisplayName,
} from '../utils/achievementUtils';

describe('getDefaultStats', () => {
  it('returns fresh stats object', () => {
    const stats = getDefaultStats();
    expect(stats.phantomsCaught).toBe(0);
    expect(stats.totalMobsDefeated).toBe(0);
    expect(stats.totalBossesDefeated).toBe(0);
    expect(stats.totalMinibossesDefeated).toBe(0);
    expect(stats.totalDeaths).toBe(0);
    expect(stats.uniqueMobsDefeated).toEqual([]);
    expect(stats.uniqueBossesDefeated).toEqual([]);
    expect(stats.uniqueMinibossesDefeated).toEqual([]);
    expect(stats.themeChanges).toBe(0);
    expect(stats.borderChanges).toBe(0);
    expect(stats.battlesThisSession).toBe(0);
    expect(stats.loginDates).toEqual([]);
    expect(stats.perfectMemoryGames).toBe(0);
    expect(stats.achievementsUnlocked).toEqual([]);
  });

  it('returns new object each call (no shared reference)', () => {
    const a = getDefaultStats();
    const b = getDefaultStats();
    expect(a).not.toBe(b);
    a.phantomsCaught = 5;
    expect(b.phantomsCaught).toBe(0);
  });
});

describe('addUniqueToArray', () => {
  it('adds value not present', () => {
    expect(addUniqueToArray(['a'], 'b')).toEqual(['a', 'b']);
  });

  it('does not duplicate existing value', () => {
    expect(addUniqueToArray(['a', 'b'], 'a')).toEqual(['a', 'b']);
  });

  it('returns new array when adding', () => {
    const original = ['a'];
    const result = addUniqueToArray(original, 'b');
    expect(result).not.toBe(original);
  });

  it('returns same array when not adding', () => {
    const original = ['a'];
    const result = addUniqueToArray(original, 'a');
    expect(result).toBe(original);
  });
});

describe('isAchievementUnlocked', () => {
  const defaultSkills = {};

  it('returns false for unknown achievement', () => {
    expect(isAchievementUnlocked('nonexistent', getDefaultStats(), defaultSkills)).toBe(false);
  });

  it('first_steps unlocks at 1 mob defeated', () => {
    const stats = { ...getDefaultStats(), totalMobsDefeated: 1 };
    expect(isAchievementUnlocked('first_steps', stats, defaultSkills)).toBe(true);
  });

  it('first_steps stays locked at 0 mobs', () => {
    expect(isAchievementUnlocked('first_steps', getDefaultStats(), defaultSkills)).toBe(false);
  });

  it('ouch unlocks at 1 death', () => {
    const stats = { ...getDefaultStats(), totalDeaths: 1 };
    expect(isAchievementUnlocked('ouch', stats, defaultSkills)).toBe(true);
  });

  it('fashion_forward unlocks at 1 theme change', () => {
    const stats = { ...getDefaultStats(), themeChanges: 1 };
    expect(isAchievementUnlocked('fashion_forward', stats, defaultSkills)).toBe(true);
  });

  it('phantom_hunter (tiered) unlocks at tier 1 (5 phantoms)', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 5 };
    expect(isAchievementUnlocked('phantom_hunter', stats, defaultSkills)).toBe(true);
  });

  it('phantom_hunter stays locked at 4 phantoms', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 4 };
    expect(isAchievementUnlocked('phantom_hunter', stats, defaultSkills)).toBe(false);
  });

  it('speed_demon unlocks at 10 battles this session', () => {
    const stats = { ...getDefaultStats(), battlesThisSession: 10 };
    expect(isAchievementUnlocked('speed_demon', stats, defaultSkills)).toBe(true);
  });

  it('dedicated unlocks at 3 login dates', () => {
    const stats = { ...getDefaultStats(), loginDates: ['2024-01-01', '2024-01-02', '2024-01-03'] };
    expect(isAchievementUnlocked('dedicated', stats, defaultSkills)).toBe(true);
  });

  it('level_up checks skills for level >= 2', () => {
    const skills = { reading: { level: 2 } };
    expect(isAchievementUnlocked('level_up', getDefaultStats(), skills)).toBe(true);
  });

  it('high_roller checks skills for difficulty >= 7', () => {
    const skills = { math: { difficulty: 7 } };
    expect(isAchievementUnlocked('high_roller', getDefaultStats(), skills)).toBe(true);
  });
});

describe('getCurrentTier', () => {
  it('returns -1 for non-tiered achievement', () => {
    expect(getCurrentTier('first_steps', getDefaultStats(), {})).toBe(-1);
  });

  it('returns -1 for unknown achievement', () => {
    expect(getCurrentTier('nonexistent', getDefaultStats(), {})).toBe(-1);
  });

  it('returns 0 at tier 1 threshold (5 phantoms)', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 5 };
    expect(getCurrentTier('phantom_hunter', stats, {})).toBe(0);
  });

  it('returns 1 at tier 2 threshold (10 phantoms)', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 10 };
    expect(getCurrentTier('phantom_hunter', stats, {})).toBe(1);
  });

  it('returns highest tier at max (100 phantoms)', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 100 };
    expect(getCurrentTier('phantom_hunter', stats, {})).toBe(7);
  });
});

describe('getNextTier', () => {
  it('returns null for non-tiered achievement', () => {
    expect(getNextTier('first_steps', getDefaultStats(), {})).toBeNull();
  });

  it('returns tier 1 when no tier reached', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 0 };
    const next = getNextTier('phantom_hunter', stats, {});
    expect(next.level).toBe(5);
  });

  it('returns null at max tier', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 100 };
    expect(getNextTier('phantom_hunter', stats, {})).toBeNull();
  });
});

describe('getTierProgress', () => {
  it('returns 0 for non-tiered', () => {
    expect(getTierProgress('first_steps', getDefaultStats(), {})).toBe(0);
  });

  it('returns 100 at max tier', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 100 };
    expect(getTierProgress('phantom_hunter', stats, {})).toBe(100);
  });

  it('returns percentage between tiers', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 7 };
    const progress = getTierProgress('phantom_hunter', stats, {});
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(100);
  });
});

describe('getNewlyUnlockedAchievements', () => {
  it('detects newly unlocked one-time achievement', () => {
    const oldStats = getDefaultStats();
    const newStats = { ...getDefaultStats(), totalMobsDefeated: 1 };
    const result = getNewlyUnlockedAchievements(oldStats, newStats, {}, {});
    expect(result).toContain('first_steps');
  });

  it('returns empty when nothing new unlocked', () => {
    const stats = getDefaultStats();
    const result = getNewlyUnlockedAchievements(stats, stats, {}, {});
    expect(result).toEqual([]);
  });
});

describe('getNewTierAchievements', () => {
  it('detects tier advancement', () => {
    const oldStats = { ...getDefaultStats(), phantomsCaught: 0 };
    const newStats = { ...getDefaultStats(), phantomsCaught: 5 };
    const result = getNewTierAchievements(oldStats, newStats, {}, {});
    expect(result).toEqual([{ achievementId: 'phantom_hunter', tierIndex: 0 }]);
  });

  it('detects multi-tier jump', () => {
    const oldStats = { ...getDefaultStats(), phantomsCaught: 0 };
    const newStats = { ...getDefaultStats(), phantomsCaught: 15 };
    const result = getNewTierAchievements(oldStats, newStats, {}, {});
    const entry = result.find(r => r.achievementId === 'phantom_hunter');
    expect(entry.tierIndex).toBe(2);
  });
});

describe('getAchievementDisplayName', () => {
  it('returns empty for unknown achievement', () => {
    expect(getAchievementDisplayName('nonexistent', getDefaultStats(), {})).toBe('');
  });

  it('returns name for one-time achievement', () => {
    expect(getAchievementDisplayName('first_steps', getDefaultStats(), {})).toBe('First Steps');
  });

  it('returns tier name when tier reached', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 5 };
    expect(getAchievementDisplayName('phantom_hunter', stats, {})).toBe('Bronze Ghost Buster');
  });

  it('returns base name when no tier reached', () => {
    const stats = { ...getDefaultStats(), phantomsCaught: 0 };
    expect(getAchievementDisplayName('phantom_hunter', stats, {})).toBe('Ghost Buster');
  });
});
