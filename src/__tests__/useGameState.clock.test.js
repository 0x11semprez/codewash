import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGameState } from '../hooks/useGameState';

describe('useGameState daily login with injected clock', () => {
    beforeEach(() => {
        const store = {};
        vi.stubGlobal('localStorage', {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => {
                store[k] = String(v);
            },
            removeItem: (k) => {
                delete store[k];
            },
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('records the injected day once', () => {
        const now = () => Date.UTC(2026, 10, 25, 8, 0);
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.stats.loginDates).toEqual(['2026-11-25']);
    });

    it('does not add the same day twice across mounts', () => {
        const now = () => Date.UTC(2026, 10, 25, 8, 0);
        renderHook(() => useGameState({ now })).unmount();
        const { result } = renderHook(() => useGameState({ now }));
        expect(result.current.stats.loginDates).toEqual(['2026-11-25']);
    });

    it('adds a new day on the next day', () => {
        renderHook(() => useGameState({ now: () => Date.UTC(2026, 10, 25) })).unmount();
        const { result } = renderHook(() => useGameState({ now: () => Date.UTC(2026, 10, 26) }));
        expect(result.current.stats.loginDates).toEqual(['2026-11-25', '2026-11-26']);
    });
});
