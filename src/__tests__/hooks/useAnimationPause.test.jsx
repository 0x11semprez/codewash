import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import {
    pauseWhenOffscreen,
    usePauseWhenPageHidden,
    OFFSCREEN_ATTRIBUTE,
    PAGE_HIDDEN_ATTRIBUTE,
} from '../../hooks/useAnimationPause';
import { installFakeIntersectionObserver } from '../helpers/fakeIntersectionObserver';

const Box = ({ id = 'box' }) => <div data-testid={id} ref={pauseWhenOffscreen} />;

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('pauseWhenOffscreen', () => {
    it('marks the element offscreen when it leaves the viewport and clears it when it comes back', () => {
        const io = installFakeIntersectionObserver();
        const { getByTestId, unmount } = render(<Box />);
        const box = getByTestId('box');

        expect(box.hasAttribute(OFFSCREEN_ATTRIBUTE)).toBe(false);
        act(() => io.trigger(box, false));
        expect(box.hasAttribute(OFFSCREEN_ATTRIBUTE)).toBe(true);
        act(() => io.trigger(box, true));
        expect(box.hasAttribute(OFFSCREEN_ATTRIBUTE)).toBe(false);
        unmount();
    });

    it('shares one observer between elements and shrinks the root by one pixel', () => {
        const io = installFakeIntersectionObserver();
        const { unmount } = render(
            <>
                <Box id="a" />
                <Box id="b" />
            </>,
        );
        expect(io.instances).toHaveLength(1);
        expect(io.instances[0].options).toEqual({ rootMargin: '-1px' });
        expect(io.instances[0].observed.size).toBe(2);
        unmount();
    });

    it('unobserves on unmount and disconnects once the last element is gone', () => {
        const io = installFakeIntersectionObserver();
        const first = render(<Box id="a" />);
        const second = render(<Box id="b" />);
        const [observer] = io.instances;
        const a = first.getByTestId('a');
        act(() => io.trigger(a, false));

        first.unmount();
        expect(observer.observed.size).toBe(1);
        expect(observer.disconnect).not.toHaveBeenCalled();
        expect(a.hasAttribute(OFFSCREEN_ATTRIBUTE)).toBe(false);

        second.unmount();
        expect(observer.disconnect).toHaveBeenCalledTimes(1);

        render(<Box id="c" />).unmount();
        expect(io.instances).toHaveLength(2);
    });

    it('leaves animations running when IntersectionObserver is missing', () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const { getByTestId, unmount } = render(<Box />);
        expect(getByTestId('box').hasAttribute(OFFSCREEN_ATTRIBUTE)).toBe(false);
        expect(() => unmount()).not.toThrow();
    });

    it('ignores a null node', () => {
        expect(pauseWhenOffscreen(null)).toBeUndefined();
    });
});

describe('usePauseWhenPageHidden', () => {
    const setHidden = (hidden) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
        document.dispatchEvent(new Event('visibilitychange'));
    };

    afterEach(() => {
        delete document.hidden;
    });

    it('pauses on <html> while the page is hidden and resumes when it is shown', () => {
        const root = document.documentElement;
        const { unmount } = renderHook(() => usePauseWhenPageHidden());
        expect(root.hasAttribute(PAGE_HIDDEN_ATTRIBUTE)).toBe(false);

        act(() => setHidden(true));
        expect(root.hasAttribute(PAGE_HIDDEN_ATTRIBUTE)).toBe(true);

        act(() => setHidden(false));
        expect(root.hasAttribute(PAGE_HIDDEN_ATTRIBUTE)).toBe(false);
        unmount();
    });

    it('reads the state on mount and removes the listener and attribute on unmount', () => {
        const root = document.documentElement;
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        const { unmount } = renderHook(() => usePauseWhenPageHidden());
        expect(root.hasAttribute(PAGE_HIDDEN_ATTRIBUTE)).toBe(true);

        unmount();
        expect(root.hasAttribute(PAGE_HIDDEN_ATTRIBUTE)).toBe(false);
        setHidden(true);
        expect(root.hasAttribute(PAGE_HIDDEN_ATTRIBUTE)).toBe(false);
    });
});
