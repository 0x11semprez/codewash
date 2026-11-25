import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createMemoryStorage } from '../helpers/memoryStorage';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from '../../hooks/useGameState';

const DEFAULT_NAMES = { 1: 'Player 1', 2: 'Player 2', 3: 'Player 3' };
const DEFAULT_STATUS = { 1: false, 2: false, 3: false };

describe('useGameState with corrupted localStorage', () => {
    let warn;
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
        warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => {
        warn.mockRestore();
        vi.unstubAllGlobals();
    });

    it('starts with defaults when profile names and parent status are corrupted', () => {
        localStorage.setItem('heroProfileNames_v1', '{broken');
        localStorage.setItem('heroParentStatus_v1', 'undefined');
        const { result } = renderHook(() => useGameState());
        expect(result.current.profileNames).toEqual(DEFAULT_NAMES);
        expect(result.current.parentStatus).toEqual(DEFAULT_STATUS);
        expect(JSON.parse(localStorage.getItem('heroProfileNames_v1'))).toEqual(DEFAULT_NAMES);
    });

    it('keeps valid profile names and parent status unchanged', () => {
        localStorage.setItem('heroProfileNames_v1', JSON.stringify({ 1: 'Ana', 2: 'Bob', 3: 'Cy' }));
        localStorage.setItem('heroParentStatus_v1', JSON.stringify({ 1: true, 2: false, 3: false }));
        const { result } = renderHook(() => useGameState());
        expect(result.current.profileNames).toEqual({ 1: 'Ana', 2: 'Bob', 3: 'Cy' });
        expect(result.current.parentStatus).toEqual({ 1: true, 2: false, 3: false });
    });

    it('handleReset does not crash when stored values are corrupted', () => {
        const reload = vi.fn();
        vi.stubGlobal('location', { ...window.location, reload });
        const { result } = renderHook(() => useGameState());
        localStorage.setItem('heroProfileNames_v1', '{broken');
        localStorage.setItem('heroParentStatus_v1', 'null');
        act(() => result.current.handleReset());
        expect(reload).toHaveBeenCalled();
        expect(JSON.parse(localStorage.getItem('heroProfileNames_v1'))).toEqual(DEFAULT_NAMES);
        expect(JSON.parse(localStorage.getItem('heroParentStatus_v1'))).toEqual(DEFAULT_STATUS);
    });

    it('backs up a corrupted skills save before it is overwritten', () => {
        const corrupted = '{"skills": {"math": {"level": 9';
        localStorage.setItem('currentProfile_v1', '2');
        localStorage.setItem('heroSkills_v23_p2', corrupted);
        const { result } = renderHook(() => useGameState());
        expect(result.current.skills.math.level).toBe(1);
        expect(localStorage.getItem('heroSkills_v23_p2_corrupted_backup')).toBe(corrupted);
        expect(JSON.parse(localStorage.getItem('heroSkills_v23_p2')).skills.math.level).toBe(1);
        expect(warn).toHaveBeenCalled();
    });

    it('does not create a backup for a valid skills save', () => {
        localStorage.setItem(
            'heroSkills_v23_p1',
            JSON.stringify({ skills: { math: { level: 7 } }, theme: 'minecraft' }),
        );
        const { result } = renderHook(() => useGameState());
        expect(result.current.skills.math.level).toBe(7);
        expect(localStorage.getItem('heroSkills_v23_p1_corrupted_backup')).toBeNull();
    });
});
