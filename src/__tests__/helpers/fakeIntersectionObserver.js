import { vi } from 'vitest';

/**
 * Replaces the global IntersectionObserver with a fake that records what it
 * observes. `trigger(element, isIntersecting)` calls the callback like the
 * browser would. Undo with vi.unstubAllGlobals().
 */
export function installFakeIntersectionObserver() {
    const instances = [];

    class FakeIntersectionObserver {
        constructor(callback, options) {
            this.callback = callback;
            this.options = options;
            this.observed = new Set();
            this.disconnect = vi.fn(() => this.observed.clear());
            instances.push(this);
        }

        observe(element) {
            this.observed.add(element);
        }

        unobserve(element) {
            this.observed.delete(element);
        }
    }

    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);

    const trigger = (element, isIntersecting) => {
        const observer = instances.find((instance) => instance.observed.has(element));
        if (!observer) throw new Error('element is not observed');
        observer.callback([{ target: element, isIntersecting }], observer);
    };

    return { instances, trigger };
}
