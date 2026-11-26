import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createMemoryStorage } from '../helpers/memoryStorage';
import { useGameState } from '../../hooks/useGameState';
import { useBattle } from '../../hooks/useBattle';

const setup = () =>
    renderHook(() => {
        const game = useGameState();
        const battle = useBattle(game.skills, game.setSkills, game.stats, game.setStats);
        return { game, battle };
    });

describe('perfectMemoryGames counter', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
        vi.stubGlobal(
            'Audio',
            class {
                play() {
                    return Promise.resolve();
                }
                pause() {}
                addEventListener() {}
            },
        );
    });
    afterEach(() => vi.unstubAllGlobals());

    it('starts at zero', () => {
        const { result } = setup();
        expect(result.current.game.stats.perfectMemoryGames).toBe(0);
    });

    it('counts a memory game won without a mismatch', () => {
        const { result } = setup();
        act(() => result.current.battle.handleSuccessHit('memory', 'WIN', { perfect: true }));
        expect(result.current.game.stats.perfectMemoryGames).toBe(1);
    });

    it('unlocks the Perfectionist achievement', () => {
        const { result } = setup();
        expect(result.current.game.unlockedAchievements).not.toContain('perfectionist');
        act(() => result.current.battle.handleSuccessHit('memory', 'WIN', { perfect: true }));
        expect(result.current.game.unlockedAchievements).toContain('perfectionist');
    });

    it('does not count a memory game with a mismatch', () => {
        const { result } = setup();
        act(() => result.current.battle.handleSuccessHit('memory', 'WIN', { perfect: false }));
        expect(result.current.game.stats.perfectMemoryGames).toBe(0);
    });

    it('does not count a win that gives no result', () => {
        const { result } = setup();
        act(() => result.current.battle.handleSuccessHit('memory', 'WIN'));
        expect(result.current.game.stats.perfectMemoryGames).toBe(0);
    });

    it('does not count another skill, even with a perfect flag', () => {
        const { result } = setup();
        act(() => result.current.battle.handleSuccessHit('patterns', 'WIN', { perfect: true }));
        expect(result.current.game.stats.perfectMemoryGames).toBe(0);
    });

    it('adds up several perfect games', () => {
        const { result } = setup();
        act(() => result.current.battle.handleSuccessHit('memory', 'WIN', { perfect: true }));
        act(() => result.current.battle.handleSuccessHit('memory', 'WIN', { perfect: true }));
        expect(result.current.game.stats.perfectMemoryGames).toBe(2);
    });
});
