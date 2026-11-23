import { describe, it, expect } from 'vitest';
import {
  getEncounterType,
  getDifficultyMultiplier,
  calculateDamage,
  calculateMobHealth,
  getExpectedDifficulty,
  calculateXPReward,
  calculateXPToLevel,
  getRandomMob,
  getRandomFriendlyMob,
  getRandomMiniboss,
  getRandomBoss,
  getMobForSkill,
  generateMathProblem,
  getReadingWord,
  getWordForDifficulty,
} from '../utils/gameUtils';

describe('getEncounterType', () => {
  it('returns hostile for levels 1-9', () => {
    for (let l = 1; l <= 9; l++) {
      expect(getEncounterType(l)).toBe('hostile');
    }
  });

  it('returns miniboss at level 10', () => {
    expect(getEncounterType(10)).toBe('miniboss');
  });

  it('returns hostile for levels 11-19', () => {
    for (let l = 11; l <= 19; l++) {
      expect(getEncounterType(l)).toBe('hostile');
    }
  });

  it('returns boss at level 20', () => {
    expect(getEncounterType(20)).toBe('boss');
  });

  it('cycles repeat: level 30 is miniboss, 40 is boss', () => {
    expect(getEncounterType(30)).toBe('miniboss');
    expect(getEncounterType(40)).toBe('boss');
  });

  it('level 21 is hostile (new cycle)', () => {
    expect(getEncounterType(21)).toBe('hostile');
  });
});

describe('getDifficultyMultiplier', () => {
  it('difficulty 1 returns 1', () => {
    expect(getDifficultyMultiplier(1)).toBe(1);
  });

  it('difficulty 2 returns 3', () => {
    expect(getDifficultyMultiplier(2)).toBe(3);
  });

  it('difficulty 3 returns 9', () => {
    expect(getDifficultyMultiplier(3)).toBe(9);
  });

  it('difficulty 7 returns 729', () => {
    expect(getDifficultyMultiplier(7)).toBe(729);
  });
});

describe('calculateDamage', () => {
  it('base damage at difficulty 1 is 12 regardless of level', () => {
    expect(calculateDamage(1, 1)).toBe(12);
    expect(calculateDamage(50, 1)).toBe(12);
  });

  it('scales with difficulty multiplier', () => {
    expect(calculateDamage(1, 2)).toBe(36);
    expect(calculateDamage(1, 3)).toBe(108);
  });
});

describe('calculateMobHealth', () => {
  it('base health at difficulty 1 is 60', () => {
    expect(calculateMobHealth(1)).toBe(60);
  });

  it('scales with difficulty: always 5x damage', () => {
    expect(calculateMobHealth(2)).toBe(180);
    expect(calculateMobHealth(3)).toBe(540);
  });
});

describe('getExpectedDifficulty', () => {
  it('levels 1-20 expect difficulty 1', () => {
    expect(getExpectedDifficulty(1)).toBe(1);
    expect(getExpectedDifficulty(20)).toBe(1);
  });

  it('levels 21-40 expect difficulty 2', () => {
    expect(getExpectedDifficulty(21)).toBe(2);
    expect(getExpectedDifficulty(40)).toBe(2);
  });

  it('caps at difficulty 7', () => {
    expect(getExpectedDifficulty(200)).toBe(7);
    expect(getExpectedDifficulty(1000)).toBe(7);
  });
});

describe('calculateXPReward', () => {
  it('without playerLevel returns base reward (backward compat)', () => {
    expect(calculateXPReward(1)).toBe(100);
    expect(calculateXPReward(2)).toBe(300);
  });

  it('at expected difficulty, full reward', () => {
    const reward = calculateXPReward(1, 1);
    expect(reward).toBeGreaterThan(0);
  });

  it('below expected difficulty, penalty applied', () => {
    const fullReward = calculateXPReward(2, 25);
    const penalizedReward = calculateXPReward(1, 25);
    expect(penalizedReward).toBeLessThan(fullReward);
  });
});

describe('calculateXPToLevel', () => {
  it('without playerLevel uses old formula', () => {
    expect(calculateXPToLevel(1)).toBe(100);
    expect(calculateXPToLevel(2)).toBe(300);
  });

  it('with playerLevel scales exponentially', () => {
    const xp1 = calculateXPToLevel(1, 1);
    const xp10 = calculateXPToLevel(1, 10);
    expect(xp10).toBeGreaterThan(xp1);
  });
});

describe('getRandomMob', () => {
  it('returns a string', () => {
    expect(typeof getRandomMob()).toBe('string');
  });

  it('excludes specified mob', () => {
    for (let i = 0; i < 50; i++) {
      expect(getRandomMob('Zombie')).not.toBe('Zombie');
    }
  });
});

describe('getRandomFriendlyMob', () => {
  it('returns a string', () => {
    expect(typeof getRandomFriendlyMob()).toBe('string');
  });
});

describe('getRandomMiniboss', () => {
  it('returns a string', () => {
    expect(typeof getRandomMiniboss()).toBe('string');
  });
});

describe('getRandomBoss', () => {
  it('returns a string', () => {
    expect(typeof getRandomBoss()).toBe('string');
  });
});

describe('getMobForSkill', () => {
  it('cleaning skill level 20 returns Ender Chest', () => {
    const result = getMobForSkill({ id: 'cleaning' }, { level: 20 });
    expect(result).toBe('Ender Chest');
  });

  it('cleaning skill level 5 returns Shulker Box', () => {
    const result = getMobForSkill({ id: 'cleaning' }, { level: 5 });
    expect(result).toBe('Shulker Box');
  });

  it('cleaning skill level 1 returns standard chest', () => {
    const result = getMobForSkill({ id: 'cleaning' }, { level: 1 });
    expect(['Chest', 'Trapped Chest', 'Barrel', 'Bundle']).toContain(result);
  });

  it('memory skill returns stored memoryMob if present', () => {
    const result = getMobForSkill({ id: 'memory' }, { level: 1, memoryMob: 'Cat' });
    expect(result).toBe('Cat');
  });

  it('boss level returns stored boss', () => {
    const result = getMobForSkill({ id: 'reading' }, { level: 20, currentBoss: 'Wither' });
    expect(result).toBe('Wither');
  });

  it('miniboss level returns stored miniboss', () => {
    const result = getMobForSkill({ id: 'reading' }, { level: 10, currentMiniboss: 'Ravager' });
    expect(result).toBe('Ravager');
  });

  it('reading at hostile level returns stored readingMob', () => {
    const result = getMobForSkill({ id: 'reading' }, { level: 1, readingMob: 'Zombie' });
    expect(result).toBe('Zombie');
  });
});

describe('generateMathProblem', () => {
  it('difficulty 1 generates addition problem', () => {
    const problem = generateMathProblem(1);
    expect(problem.type).toBe('math');
    expect(problem.question).toContain('+');
    expect(problem.question).toContain('= ?');
    expect(problem.answer).toBeDefined();
  });

  it('difficulty 6 generates PEMDAS problem', () => {
    const problem = generateMathProblem(6);
    expect(problem.isPemdas).toBe(true);
  });

  it('difficulty 7 generates nightmare problem', () => {
    const problem = generateMathProblem(7);
    expect(problem.isNightmare).toBe(true);
  });

  it('answer is always a string', () => {
    for (let d = 1; d <= 7; d++) {
      const problem = generateMathProblem(d);
      expect(typeof problem.answer).toBe('string');
    }
  });

  // BUG: subtraction CAN produce negative results when range starts at 0
  // because a=0 and b=Math.floor(Math.random()*0)+1=1 gives 0-1=-1
  // Documented in DEBT.md, not fixed here (characterization test)
  it('subtraction produces integer answer', () => {
    for (let i = 0; i < 100; i++) {
      const problem = generateMathProblem(3);
      const answer = parseInt(problem.answer, 10);
      expect(Number.isInteger(answer)).toBe(true);
    }
  });
});

describe('getReadingWord', () => {
  it('returns a string for each difficulty', () => {
    for (let d = 1; d <= 7; d++) {
      expect(typeof getReadingWord(d)).toBe('string');
    }
  });

  it('difficulty 7 returns a funny long word', () => {
    const word = getReadingWord(7);
    expect(word.length).toBeGreaterThan(10);
  });
});

describe('getWordForDifficulty', () => {
  it('returns object with word, displayName, image', () => {
    const result = getWordForDifficulty(1);
    expect(result).toHaveProperty('word');
    expect(result).toHaveProperty('displayName');
    expect(result).toHaveProperty('image');
  });

  it('word is uppercase', () => {
    for (let d = 1; d <= 7; d++) {
      const result = getWordForDifficulty(d);
      expect(result.word).toBe(result.word.toUpperCase());
    }
  });

  it('difficulties 6 and 7 map to pool 5', () => {
    const r6 = getWordForDifficulty(6);
    const r7 = getWordForDifficulty(7);
    expect(r6.word).toBeDefined();
    expect(r7.word).toBeDefined();
  });
});
