import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import MobWithAura from '../../components/ui/MobWithAura';
import { installFakeIntersectionObserver } from '../helpers/fakeIntersectionObserver';

describe('MobWithAura', () => {
    it('renders container with aura data attribute', () => {
        const { container } = render(<MobWithAura mobSrc="test.png" aura="frost" displayName="Frozen Zombie" />);
        const el = container.querySelector('[data-aura="frost"]');
        expect(el).toBeInTheDocument();
    });

    it('defaults size to 100%', () => {
        const { container } = render(<MobWithAura mobSrc="test.png" aura="lava" displayName="Test" />);
        const el = container.firstChild;
        expect(el.style.width).toBe('100%');
        expect(el.style.height).toBe('100%');
    });

    it('accepts numeric size in px', () => {
        const { container } = render(<MobWithAura mobSrc="test.png" aura="shadow" displayName="Test" size={160} />);
        const el = container.firstChild;
        expect(el.style.width).toBe('160px');
    });

    it('applies animation classes based on state', () => {
        const { container } = render(<MobWithAura mobSrc="test.png" aura="rainbow" displayName="Test" isHit={true} />);
        const img = container.querySelector('.mob-image');
        expect(img.className).toContain('animate-knockback');
    });

    it('pauses its aura while it is outside the viewport', () => {
        const io = installFakeIntersectionObserver();
        const { container, unmount } = render(<MobWithAura mobSrc="test.png" aura="plasma" displayName="Test" />);
        const el = container.firstChild;
        expect(io.instances[0].observed.has(el)).toBe(true);
        act(() => io.trigger(el, false));
        expect(el).toHaveAttribute('data-offscreen');
        act(() => io.trigger(el, true));
        expect(el).not.toHaveAttribute('data-offscreen');
        unmount();
        vi.unstubAllGlobals();
    });
});
