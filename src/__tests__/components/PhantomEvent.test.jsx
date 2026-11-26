import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PhantomEvent from '../../components/PhantomEvent';
import { STORAGE_KEYS } from '../../services/storageKeys';
import { createMemoryStorage } from '../helpers/memoryStorage';
import { playSuccessfulHit } from '../../services/soundManager';

vi.mock('../../services/soundManager', () => ({ playSuccessfulHit: vi.fn() }));

const NOW = Date.UTC(2026, 10, 25, 12, 0, 0);
const MINUTE = 60 * 1000;
const phantom = () => screen.queryByAltText('Bonus creature');
const flier = () => phantom()?.closest('.fixed');

describe('PhantomEvent', () => {
    let random;
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
        vi.stubGlobal('localStorage', createMemoryStorage());
        random = vi.spyOn(Math, 'random').mockReturnValue(0);
        vi.mocked(playSuccessfulHit).mockClear();
    });
    afterEach(() => {
        random.mockRestore();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('flies in right away when the cooldown is over, then leaves after its flight', () => {
        render(<PhantomEvent battlingSkillId={null} onAwardLevel={vi.fn()} />);
        act(() => vi.advanceTimersByTime(1));
        expect(phantom()).toBeInTheDocument();
        expect(flier().style.left).toBe('calc(100vw)');
        expect(flier().style.animation).toContain('phantomFlyRight');
        expect(flier().firstChild.style.transform).toBe('scaleX(1)');
        expect(localStorage.getItem(STORAGE_KEYS.phantomLastSpawn)).toBe(String(NOW));

        act(() => vi.advanceTimersByTime(8000));
        expect(phantom()).toBeNull();
    });

    it('flies in from the left after a random wait when the coin says so', () => {
        random.mockReturnValue(0.9);
        render(<PhantomEvent battlingSkillId={null} onAwardLevel={vi.fn()} />);
        act(() => vi.advanceTimersByTime(4.5 * MINUTE - 1));
        expect(phantom()).toBeNull();
        act(() => vi.advanceTimersByTime(1));
        expect(flier().style.left).toBe('-120px');
        expect(flier().style.animation).toContain('phantomFlyLeft');
        expect(flier().firstChild.style.transform).toBe('scaleX(-1)');
    });

    it('waits for the five minute cooldown after a recent visit', () => {
        localStorage.setItem(STORAGE_KEYS.phantomLastSpawn, String(NOW - 2 * MINUTE));
        render(<PhantomEvent battlingSkillId={null} onAwardLevel={vi.fn()} />);
        act(() => vi.advanceTimersByTime(3 * MINUTE - 1));
        expect(phantom()).toBeNull();
        act(() => vi.advanceTimersByTime(1));
        expect(phantom()).toBeInTheDocument();
    });

    it('gives a level to the skill in battle when caught, only once', () => {
        const onAwardLevel = vi.fn();
        const onPhantomCaught = vi.fn();
        render(<PhantomEvent battlingSkillId="math" onAwardLevel={onAwardLevel} onPhantomCaught={onPhantomCaught} />);
        act(() => vi.advanceTimersByTime(1));

        fireEvent.click(flier());
        fireEvent.click(flier());
        expect(screen.getByText('+1 Level!')).toBeInTheDocument();
        expect(flier().style.opacity).toBe('0');
        expect(onAwardLevel).toHaveBeenCalledExactlyOnceWith('math');
        expect(onPhantomCaught).toHaveBeenCalledOnce();
        expect(playSuccessfulHit).toHaveBeenCalledOnce();

        act(() => vi.advanceTimersByTime(200));
        expect(phantom()).toBeNull();
        // The flight timer was cleared: the next visit is scheduled from the catch.
        act(() => vi.advanceTimersByTime(5 * MINUTE));
        expect(phantom()).toBeInTheDocument();
    });

    it('counts a catch outside battles without giving a level', () => {
        const onAwardLevel = vi.fn();
        render(<PhantomEvent battlingSkillId={null} onAwardLevel={onAwardLevel} />);
        act(() => vi.advanceTimersByTime(1));
        fireEvent.click(flier());
        expect(onAwardLevel).not.toHaveBeenCalled();
        expect(playSuccessfulHit).toHaveBeenCalledOnce();
    });

    it('stops its timers when it unmounts', () => {
        const { unmount } = render(<PhantomEvent battlingSkillId={null} onAwardLevel={vi.fn()} />);
        act(() => vi.advanceTimersByTime(1));
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('stops its spawn timer when it unmounts before the first visit', () => {
        const { unmount } = render(<PhantomEvent battlingSkillId={null} onAwardLevel={vi.fn()} />);
        unmount();
        expect(vi.getTimerCount()).toBe(0);
    });
});
