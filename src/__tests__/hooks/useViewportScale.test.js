import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CARD_HEIGHT, MIN_SCALE, getCardScale, getBattleScale, useViewportScale } from '../../hooks/useViewportScale';

const setWindowHeight = (height) => {
    Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true });
};

afterEach(() => {
    setWindowHeight(768);
});

describe('getCardScale', () => {
    it('keeps the full card size on a tall window', () => {
        expect(getCardScale(1400)).toBe(1);
    });

    it('shrinks the cards on shorter windows, more when the window is shorter', () => {
        const sizes = [1080, 940, 768, 720].map(getCardScale);
        sizes.forEach((scale) => expect(scale).toBeLessThan(1));
        expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    });

    it('never goes below the minimum scale', () => {
        expect(getCardScale(200)).toBe(MIN_SCALE);
    });
});

describe('getBattleScale', () => {
    it('keeps the 1.5 battle zoom when the card fits', () => {
        expect(getBattleScale(1400)).toBe(1.5);
    });

    it('makes the battle card fit the window height', () => {
        [940, 768, 720].forEach((height) => {
            expect(getBattleScale(height) * CARD_HEIGHT).toBeLessThanOrEqual(height);
        });
    });

    it('never goes below the minimum scale', () => {
        expect(getBattleScale(200)).toBe(MIN_SCALE);
    });
});

describe('useViewportScale', () => {
    it('gives the scales of the current window and follows a resize', () => {
        setWindowHeight(1400);
        const { result, unmount } = renderHook(() => useViewportScale());
        expect(result.current).toEqual({ cardScale: 1, battleScale: 1.5 });

        act(() => {
            setWindowHeight(720);
            window.dispatchEvent(new Event('resize'));
        });
        expect(result.current).toEqual({ cardScale: getCardScale(720), battleScale: getBattleScale(720) });
        unmount();
    });
});
