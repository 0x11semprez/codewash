import { useState } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBattle } from '../../hooks/useBattle';
import { SKILL_DATA, getTheme } from '../../constants/gameData';
import { calculateMobHealth, calculateXPToLevel } from '../../utils/gameUtils';
import { getDefaultStats } from '../../utils/achievementUtils';
import { playAchievement, playFail, playDeath, playMobHurt, playMobDeath } from '../../services/soundManager';

vi.mock('../../services/soundManager', () => {
    const names = [
        'playClick',
        'playDeath',
        'playFail',
        'playLevelUp',
        'playNotification',
        'playSuccessfulHit',
        'playMobHurt',
        'playMobDeath',
        'playAchievement',
    ];
    return Object.fromEntries(names.map((name) => [name, vi.fn()]));
});

const makeSkill = (overrides = {}) => ({
    level: 2,
    xp: 0,
    difficulty: 1,
    earnedBadges: [],
    mobHealth: calculateMobHealth(1),
    mobMaxHealth: calculateMobHealth(1),
    lostLevel: false,
    recoveryDifficulty: null,
    ...overrides,
});

const makeSkills = (overrides = {}) =>
    Object.fromEntries(SKILL_DATA.map((skill) => [skill.id, makeSkill(overrides[skill.id])]));

// Real React state for skills and stats, like App gives to the hook.
const renderBattle = (skills = makeSkills(), stats = getDefaultStats()) =>
    renderHook(() => {
        const [liveSkills, setSkills] = useState(skills);
        const [liveStats, setStats] = useState(stats);
        const battle = useBattle(liveSkills, setSkills, liveStats, setStats, getTheme());
        return { skills: liveSkills, stats: liveStats, battle };
    });

describe('useBattle startBattle', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it.each([
        ['reading', 'reading'],
        ['math', 'math'],
        ['writing', 'writing'],
        ['memory', 'memory'],
        ['patterns', 'patterns'],
        ['cleaning', 'manual'],
    ])('gives the %s skill a %s challenge', (skillId, type) => {
        const { result } = renderBattle();
        act(() => result.current.battle.startBattle(skillId));
        expect(result.current.battle.battlingSkillId).toBe(skillId);
        expect(result.current.battle.challengeData.type).toBe(type);
    });

    it('makes a miniboss one step harder, up to the top difficulty', () => {
        const { result } = renderBattle(
            makeSkills({ math: { level: 10, difficulty: 3 }, reading: { level: 10, difficulty: 7 } }),
        );
        act(() => result.current.battle.startBattle('math'));
        expect(result.current.battle.battleDifficulty).toBe(4);
        act(() => result.current.battle.startBattle('reading'));
        expect(result.current.battle.battleDifficulty).toBe(7);
    });

    it('uses difficulty 1 for a skill with no difficulty yet', () => {
        const { result } = renderBattle(makeSkills({ math: { difficulty: undefined } }));
        act(() => result.current.battle.startBattle('math'));
        expect(result.current.battle.battleDifficulty).toBe(1);
    });

    it('starts the music and the voice listener for reading when the browser has speech recognition', () => {
        vi.stubGlobal('webkitSpeechRecognition', function SpeechRecognition() {});
        const startVoice = vi.fn();
        const startBGM = vi.fn();
        const { result } = renderBattle();
        act(() => result.current.battle.startBattle('reading', startVoice, startBGM));
        expect(startBGM).toHaveBeenCalledOnce();
        expect(startVoice).toHaveBeenCalledWith('reading', 'reading');
    });

    it('does not start a voice listener without speech recognition', () => {
        vi.stubGlobal('webkitSpeechRecognition', undefined);
        const startVoice = vi.fn();
        const { result } = renderBattle();
        act(() => result.current.battle.startBattle('reading', startVoice));
        expect(startVoice).not.toHaveBeenCalled();
    });
});

describe('useBattle achievement toasts', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.mocked(playAchievement).mockClear();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('shows the first unlocked achievement after a defeat, then hides it', () => {
        const { result } = renderBattle();
        act(() => result.current.battle.handleSuccessHit('cleaning'));
        expect(result.current.stats.totalMobsDefeated).toBe(1);
        expect(result.current.battle.achievementToast).toEqual({ achievementId: 'first_steps', tierIndex: null });
        expect(playAchievement).toHaveBeenCalledOnce();
        act(() => vi.advanceTimersByTime(6000));
        expect(result.current.battle.achievementToast).toBeNull();
    });

    it('shows a new tier when nothing new is unlocked but a tiered achievement goes up', () => {
        // Combined levels: 199 now. Winning back the lost cleaning level reaches 200, the second tier.
        const skills = makeSkills({
            reading: { level: 50 },
            math: { level: 50 },
            writing: { level: 50 },
            memory: { level: 20 },
            patterns: { level: 20 },
            cleaning: { level: 9, lostLevel: true },
        });
        const stats = { ...getDefaultStats(), totalMobsDefeated: 5 };
        const { result } = renderBattle(skills, stats);
        act(() => result.current.battle.handleSuccessHit('cleaning'));
        expect(result.current.battle.achievementToast).toEqual({ achievementId: 'combined_levels', tierIndex: 1 });
        expect(playAchievement).toHaveBeenCalledOnce();
    });

    it('shows no toast when the defeat changes no achievement', () => {
        const stats = { ...getDefaultStats(), totalMobsDefeated: 5 };
        const { result } = renderBattle(makeSkills(), stats);
        act(() => result.current.battle.handleSuccessHit('cleaning'));
        expect(result.current.stats.totalMobsDefeated).toBe(6);
        expect(result.current.battle.achievementToast).toBeNull();
        expect(playAchievement).not.toHaveBeenCalled();
    });
});

describe('useBattle phantom bonus', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('gives one level, shows the bonus loot, then hides it', () => {
        const { result } = renderBattle();
        act(() => result.current.battle.handlePhantomLevelAward('math'));
        expect(result.current.skills.math.level).toBe(3);
        expect(result.current.battle.lootBox).toMatchObject({
            skillId: 'math',
            itemKey: 'loot.phantomBonus',
            level: 3,
        });
        act(() => vi.advanceTimersByTime(4000));
        expect(result.current.battle.lootBox).toBeNull();
    });

    it('ignores a phantom award with no skill', () => {
        const { result } = renderBattle();
        const before = result.current.skills;
        act(() => result.current.battle.handlePhantomLevelAward(null));
        expect(result.current.skills).toBe(before);
    });
});

describe('useBattle wrong answers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });
    afterEach(() => vi.useRealTimers());

    const wrongAnswer = (result) => act(() => result.current.battle.handleSuccessHit(null, 'WRONG'));

    it('only costs a heart when no battle is running', () => {
        const { result } = renderBattle();
        wrongAnswer(result);
        expect(result.current.battle.playerHealth).toBe(9);
        expect(playFail).not.toHaveBeenCalled();
    });

    it('costs a heart and plays the fail sound during a battle', () => {
        const { result } = renderBattle();
        act(() => result.current.battle.startBattle('math'));
        wrongAnswer(result);
        expect(result.current.battle.playerHealth).toBe(9);
        expect(playFail).toHaveBeenCalledOnce();
        expect(result.current.skills.math.level).toBe(2);
    });

    it('heals the boss instead of hurting the player', () => {
        const { result } = renderBattle(makeSkills({ math: { level: 20, mobHealth: 1 } }));
        act(() => result.current.battle.startBattle('math'));
        wrongAnswer(result);
        expect(result.current.skills.math.mobHealth).toBe(result.current.skills.math.mobMaxHealth);
        expect(result.current.battle.bossHealing).toBe('math');
        expect(result.current.battle.playerHealth).toBe(10);
        act(() => vi.advanceTimersByTime(600));
        expect(result.current.battle.bossHealing).toBeNull();
    });

    it('loses a level on the last heart, counts the death and ends the battle', () => {
        const { result } = renderBattle(makeSkills({ math: { level: 5, difficulty: 3 } }));
        act(() => result.current.battle.startBattle('math'));
        for (let i = 0; i < 10; i += 1) wrongAnswer(result);

        expect(playDeath).toHaveBeenCalledOnce();
        expect(result.current.battle.showDeathOverlay).toBe(true);
        expect(result.current.battle.playerHealth).toBe(10);
        expect(result.current.stats.totalDeaths).toBe(1);
        expect(result.current.battle.achievementToast).toEqual({ achievementId: 'ouch', tierIndex: null });
        expect(result.current.skills.math).toMatchObject({ level: 4, lostLevel: true, recoveryDifficulty: 2 });

        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.battle.battlingSkillId).toBeNull();
        expect(result.current.battle.showDeathOverlay).toBe(false);
    });

    it('never drops below level 1 and counts deaths on top of older saves', () => {
        const stats = { ...getDefaultStats(), totalDeaths: undefined };
        const { result } = renderBattle(makeSkills({ math: { level: 1, difficulty: undefined } }), stats);
        act(() => result.current.battle.startBattle('math'));
        for (let i = 0; i < 10; i += 1) wrongAnswer(result);
        expect(result.current.stats.totalDeaths).toBe(1);
        expect(result.current.skills.math).toMatchObject({ level: 1, lostLevel: false, recoveryDifficulty: 1 });
    });
});

describe('useBattle right answers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
    });
    afterEach(() => vi.useRealTimers());

    const hit = (result, skillId) => act(() => result.current.battle.handleSuccessHit(skillId));

    it('ignores a hit with no skill', () => {
        const { result } = renderBattle();
        const before = result.current.skills;
        hit(result, null);
        expect(result.current.skills).toBe(before);
    });

    it('hurts a normal enemy, gives some XP, shows the damage and asks a new question', () => {
        const { result } = renderBattle();
        act(() => result.current.battle.startBattle('math'));
        const firstChallenge = result.current.battle.challengeData;
        hit(result, 'math');
        const math = result.current.skills.math;
        expect(math.mobHealth).toBeLessThan(math.mobMaxHealth);
        expect(math.xp).toBeGreaterThan(0);
        expect(playMobHurt).toHaveBeenCalledOnce();
        expect(result.current.battle.damageNumbers).toHaveLength(1);
        expect(result.current.battle.challengeData).not.toBe(firstChallenge);
        act(() => vi.advanceTimersByTime(800));
        expect(result.current.battle.damageNumbers).toEqual([]);
    });

    it('clears the spoken text after a reading hit', () => {
        const setSpoken = vi.fn();
        const { result } = renderBattle();
        act(() => result.current.battle.setSpokenTextSetter(setSpoken));
        act(() => result.current.battle.startBattle('reading'));
        hit(result, 'reading');
        expect(setSpoken).toHaveBeenCalledWith('');
    });

    it('defeats a miniboss in one hit and counts it', () => {
        const { result } = renderBattle(makeSkills({ math: { level: 10 } }));
        hit(result, 'math');
        expect(playMobDeath).toHaveBeenCalledOnce();
        expect(result.current.stats.totalMinibossesDefeated).toBe(1);
        expect(result.current.stats.uniqueMinibossesDefeated).toHaveLength(1);
        expect(result.current.skills.math.currentMiniboss).toBeTruthy();
    });

    it('counts a boss defeat', () => {
        const { result } = renderBattle(makeSkills({ reading: { level: 20, mobHealth: 1 } }));
        hit(result, 'reading');
        expect(result.current.stats.totalBossesDefeated).toBe(1);
        expect(result.current.stats.uniqueBossesDefeated).toHaveLength(1);
        expect(result.current.skills.reading.currentBoss).toBeTruthy();
    });

    it('starts the counters of an older save that has none', () => {
        const stats = { ...getDefaultStats() };
        [
            'battlesThisSession',
            'totalMobsDefeated',
            'uniqueMobsDefeated',
            'totalBossesDefeated',
            'uniqueBossesDefeated',
            'totalMinibossesDefeated',
            'uniqueMinibossesDefeated',
        ].forEach((key) => delete stats[key]);
        const skills = makeSkills({
            writing: { mobHealth: 1, difficulty: undefined, earnedBadges: undefined },
            math: { level: 10 },
            reading: { level: 20, mobHealth: 1 },
        });
        const { result } = renderBattle(skills, stats);
        hit(result, 'writing');
        hit(result, 'math');
        hit(result, 'reading');
        expect(result.current.stats).toMatchObject({
            battlesThisSession: 3,
            totalMobsDefeated: 1,
            totalMinibossesDefeated: 1,
            totalBossesDefeated: 1,
        });
        expect(result.current.skills.writing.difficulty).toBe(1);
        expect(result.current.skills.writing.earnedBadges).toEqual([]);
        expect(result.current.skills.writing.writingMob).toBeTruthy();
    });

    it('finds a new friend after a memory win and closes the battle', () => {
        const { result } = renderBattle();
        act(() => result.current.battle.startBattle('memory'));
        hit(result, 'memory');
        expect(result.current.skills.memory.memoryMob).toBeTruthy();
        expect(result.current.battle.damageNumbers).toEqual([]);
        expect(result.current.battle.battlingSkillId).toBeNull();
    });

    it('picks a new enemy and aura after a pattern win', () => {
        const { result } = renderBattle(makeSkills({ patterns: { mobHealth: 1 } }));
        hit(result, 'patterns');
        expect(result.current.skills.patterns.patternMob).toBeTruthy();
        expect(result.current.skills.patterns.patternMobAura).toBeTruthy();
    });

    it('gives back a lost level on the next win', () => {
        const { result } = renderBattle(
            makeSkills({ math: { level: 4, lostLevel: true, recoveryDifficulty: 1, mobHealth: 1 } }),
        );
        hit(result, 'math');
        expect(result.current.skills.math).toMatchObject({ lostLevel: false, recoveryDifficulty: null });
        expect(result.current.skills.math.level).toBeGreaterThanOrEqual(5);
        expect(result.current.battle.showLevelRestored).toBe(true);
        act(() => vi.advanceTimersByTime(2000));
        expect(result.current.battle.showLevelRestored).toBe(false);
    });

    it('earns a new rank badge when a win passes level 20', () => {
        const xp = calculateXPToLevel(1, 19) * 2;
        const { result } = renderBattle(makeSkills({ math: { level: 19, xp, mobHealth: 1 } }));
        hit(result, 'math');
        const math = result.current.skills.math;
        expect(math.level).toBeGreaterThan(20);
        expect(math.earnedBadges).toContain(1);
        expect(math.difficulty).toBe(2);
        expect(result.current.battle.lootBox).toMatchObject({ skillId: 'math', itemKey: 'loot.newRank', level: 20 });
    });

    it('does not give rank badges for cleaning', () => {
        const xp = calculateXPToLevel(1, 19) * 2;
        const { result } = renderBattle(makeSkills({ cleaning: { level: 19, xp } }));
        hit(result, 'cleaning');
        expect(result.current.skills.cleaning.level).toBeGreaterThan(20);
        expect(result.current.skills.cleaning.earnedBadges).toEqual([]);
        expect(result.current.battle.lootBox).toBeNull();
    });
});
