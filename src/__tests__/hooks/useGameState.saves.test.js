import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../../hooks/useGameState';
import { createMemoryStorage } from '../helpers/memoryStorage';
import { skillsKey, borderEffectKey, borderColorKey } from '../../services/storageKeys';
import { SKILL_DATA, DEFAULT_THEME_ID } from '../../constants/gameData';
import { calculateMobHealth } from '../../utils/gameUtils';

const now = () => Date.UTC(2026, 10, 25, 8, 0);
const save = (profileId, data) => localStorage.setItem(skillsKey(profileId), JSON.stringify(data));

describe('useGameState loading older or partial saves', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('reads a save that holds the skills at the top level', () => {
        save(1, { reading: { level: 7 } });
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.skills.reading.level).toBe(7);
        expect(result.current.activeTheme).toBe(DEFAULT_THEME_ID);
    });

    it('fills every missing field of a saved skill with a valid default', () => {
        const bare = Object.fromEntries(SKILL_DATA.map((skill) => [skill.id, { level: 3, mobHealth: 'x' }]));
        Object.values(bare).forEach((skill) => {
            Object.assign(skill, {
                difficulty: 'hard',
                earnedBadges: 'none',
                lostLevel: 'no',
                memoryMob: null,
                patternMob: null,
                readingMob: null,
                mathMob: null,
                writingMob: null,
                readingMobAura: null,
                mathMobAura: null,
                writingMobAura: null,
                patternMobAura: null,
                currentMiniboss: null,
                currentBoss: null,
                currentMinibossAura: null,
                currentBossAura: null,
            });
        });
        save(1, { skills: bare });

        const { result } = renderHook(() => useGameState({ now }));
        const { skills } = result.current;

        Object.values(skills).forEach((skill) => {
            expect(skill.level).toBe(3);
            expect(skill.difficulty).toBe(1);
            expect(skill.earnedBadges).toEqual([]);
            expect(typeof skill.mobHealth).toBe('number');
            expect(skill.mobMaxHealth).toBe(skill.mobHealth);
            expect(skill.lostLevel).toBe(false);
            expect(skill.recoveryDifficulty).toBeNull();
        });
        expect(skills.memory.memoryMob).toBeTruthy();
        expect(skills.patterns.patternMob).toBeTruthy();
        expect(skills.patterns.patternMobAura).toBeTruthy();
        ['reading', 'math', 'writing'].forEach((id) => {
            expect(skills[id][`${id}Mob`]).toBeTruthy();
            expect(skills[id][`${id}MobAura`]).toBeTruthy();
        });
        ['reading', 'math', 'writing', 'patterns'].forEach((id) => {
            expect(skills[id].currentMiniboss).toBeTruthy();
            expect(skills[id].currentBoss).toBeTruthy();
            expect(skills[id].currentMinibossAura).toBeTruthy();
            expect(skills[id].currentBossAura).toBeTruthy();
        });
        // Cleaning and memory have no boss fights, so nothing is added for them.
        expect(skills.cleaning.currentBoss).toBeNull();
        expect(skills.memory.currentMiniboss).toBeNull();
    });

    it('keeps the valid fields of a saved skill', () => {
        save(1, {
            skills: {
                memory: { memoryMob: 'Cat', difficulty: 4, earnedBadges: [1], mobHealth: 9, lostLevel: true },
                reading: { readingMob: 'Zombie', readingMobAura: 'frost', recoveryDifficulty: 2 },
            },
        });
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.skills.memory).toMatchObject({
            memoryMob: 'Cat',
            difficulty: 4,
            earnedBadges: [1],
            mobHealth: 9,
            lostLevel: true,
        });
        expect(result.current.skills.reading).toMatchObject({
            readingMob: 'Zombie',
            readingMobAura: 'frost',
            recoveryDifficulty: 2,
        });
    });

    it('gives a skill saved with difficulty 0 the health of difficulty 1', () => {
        save(1, { skills: { math: { difficulty: 0, mobHealth: null } } });
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.skills.math.mobHealth).toBe(calculateMobHealth(1));
    });

    it('keeps a skill the game does not know any more, with safe defaults', () => {
        save(1, { skills: { oldSkill: { level: 4 } } });
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.skills.oldSkill).toMatchObject({
            level: 4,
            difficulty: 1,
            earnedBadges: [],
            lostLevel: false,
            recoveryDifficulty: null,
        });
    });

    it('starts the login list when saved stats have none', () => {
        save(1, { skills: {}, stats: { totalDeaths: 2, loginDates: null } });
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.stats.totalDeaths).toBe(2);
        expect(result.current.stats.loginDates).toEqual(['2026-11-25']);
    });

    it('records the login once in strict mode, where effects run twice', () => {
        const { result } = renderHook(() => useGameState({ now }), { wrapper: React.StrictMode });
        expect(result.current.stats.loginDates).toEqual(['2026-11-25']);
    });
});

describe('useGameState unlocked rewards', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('unlocks one border per earned badge tier and the star border at level 180', () => {
        save(1, { skills: { reading: { earnedBadges: [1, 3, 9], level: 180 }, math: { earnedBadges: null } } });
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.unlockedBorders.sort()).toEqual(['Gold', 'Star', 'Wood']);
    });

    it('lists the achievements the saved progress already unlocks', () => {
        save(1, { skills: {}, stats: { perfectMemoryGames: 1 } });
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.unlockedAchievements).toEqual(['perfectionist']);
    });
});

describe('useGameState getProfileStats', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('sums the levels of the live skills and ignores entries without a level', () => {
        const { result } = renderHook(() => useGameState({ now }));
        const stats = result.current.getProfileStats(1, { reading: { level: 4 }, math: { level: 9 }, x: null });
        expect(stats).toMatchObject({ totalLevel: 13, highestLevel: 9, theme: DEFAULT_THEME_ID });
    });

    it('reads another profile from its save, old or new format', () => {
        save(2, { skills: { reading: { level: 5 }, math: { level: 2 }, broken: {} }, theme: 'space' });
        save(3, { reading: { level: 1 } });
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.getProfileStats(2)).toMatchObject({ totalLevel: 7, highestLevel: 5, theme: 'space' });
        expect(result.current.getProfileStats(3)).toMatchObject({ totalLevel: 1, highestLevel: 1 });
    });

    it('returns null for a profile with no save and skips empty skill entries', () => {
        save(3, { skills: { reading: null, math: { level: 2 } } });
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.getProfileStats(2)).toBeNull();
        expect(result.current.getProfileStats(3)).toMatchObject({ totalLevel: 2 });
    });
});

describe('useGameState profile actions', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
    });
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('switching profile', () => {
        const setUpTwoProfiles = () => {
            save(1, { stats: { totalMobsDefeated: 42, themeChanges: 3 } });
            localStorage.setItem(borderEffectKey(1), 'lifestream');
            localStorage.setItem(borderColorKey(1), '#00ff00');
            save(3, { stats: { totalMobsDefeated: 0 } });
            localStorage.setItem(borderEffectKey(3), 'fire');
            localStorage.setItem(borderColorKey(3), '#ff0000');
            return renderHook(() => useGameState({ now }));
        };

        it('shows the stats, the border and the color of the new profile', () => {
            const { result } = setUpTwoProfiles();
            expect(result.current.stats.totalMobsDefeated).toBe(42);
            act(() => result.current.handleSwitchProfile(3));
            expect(result.current.stats.totalMobsDefeated).toBe(0);
            expect(result.current.stats.themeChanges).toBe(0);
            expect(result.current.selectedBorder).toBe('fire');
            expect(result.current.borderColor).toBe('#ff0000');
        });

        it('does not overwrite the save of the new profile with the old one', () => {
            const { result } = setUpTwoProfiles();
            act(() => result.current.handleSwitchProfile(3));
            expect(JSON.parse(localStorage.getItem(skillsKey(3))).stats.totalMobsDefeated).toBe(0);
            expect(localStorage.getItem(borderEffectKey(3))).toBe('fire');
            expect(localStorage.getItem(borderColorKey(3))).toBe('#ff0000');
        });

        it('keeps the data of the first profile when switching back', () => {
            const { result } = setUpTwoProfiles();
            act(() => result.current.handleSwitchProfile(3));
            act(() => result.current.handleSwitchProfile(1));
            expect(result.current.stats.totalMobsDefeated).toBe(42);
            expect(result.current.selectedBorder).toBe('lifestream');
            expect(result.current.borderColor).toBe('#00ff00');
            expect(JSON.parse(localStorage.getItem(skillsKey(1))).stats.totalMobsDefeated).toBe(42);
        });

        it('forgets the border and its color of the profile that is reset, and only of that one', () => {
            vi.stubGlobal('location', { ...window.location, reload: vi.fn() });
            const { result } = setUpTwoProfiles();
            act(() => result.current.handleReset());
            expect(window.location.reload).toHaveBeenCalled();
            expect(localStorage.getItem(borderEffectKey(1))).toBeNull();
            expect(localStorage.getItem(borderColorKey(1))).toBeNull();
            expect(localStorage.getItem(borderEffectKey(3))).toBe('fire');
            expect(localStorage.getItem(borderColorKey(3))).toBe('#ff0000');
        });

        it('uses the default stats, border and color for a profile with no save', () => {
            const { result } = setUpTwoProfiles();
            act(() => result.current.handleSwitchProfile(2));
            expect(result.current.stats.totalMobsDefeated).toBe(0);
            expect(result.current.selectedBorder).toBe('solid');
            expect(result.current.borderColor).toBe('#FFD700');
        });
    });

    it('does nothing when switching to the profile that is already open', () => {
        const { result } = renderHook(() => useGameState({ now }));
        const before = result.current.skills;
        act(() => result.current.handleSwitchProfile(1));
        expect(result.current.skills).toBe(before);
    });

    it('maxes every skill of the open profile once a parent is verified', () => {
        vi.useFakeTimers();
        try {
            const { result } = renderHook(() => useGameState({ now }));
            act(() => result.current.handleParentVerified(1, true));
            Object.values(result.current.skills).forEach((skill) => {
                expect(skill).toMatchObject({
                    level: 200,
                    difficulty: 7,
                    earnedBadges: [1, 2, 3, 4, 5, 6, 7, 8],
                    mobHealth: calculateMobHealth(7),
                });
            });
            const before = result.current.skills;
            act(() => vi.runAllTimers());
            expect(result.current.skills).not.toBe(before);
            expect(result.current.skills).toEqual(before);
        } finally {
            vi.useRealTimers();
        }
    });

    it('only maxes the skills when the verified profile is the open one', () => {
        const { result } = renderHook(() => useGameState({ now }));
        act(() => result.current.handleParentVerified(2, true));
        expect(result.current.parentStatus[2]).toBe(true);
        expect(result.current.skills.reading.level).toBe(1);
    });
});
