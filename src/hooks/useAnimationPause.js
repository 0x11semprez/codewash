import { useEffect } from 'react';

// CSS in src/styles/animation-pause.css pauses every animation under these attributes.
export const OFFSCREEN_ATTRIBUTE = 'data-offscreen';
export const PAGE_HIDDEN_ATTRIBUTE = 'data-page-hidden';

// A closed drawer sits at -100% and touches the viewport edge. The spec counts an
// edge-adjacent element as intersecting, so the root is shrunk by one pixel.
const ROOT_MARGIN = '-1px';

let observer = null;
let watchedCount = 0;

const handleEntries = (entries) => {
    entries.forEach((entry) => {
        entry.target.toggleAttribute(OFFSCREEN_ATTRIBUTE, !entry.isIntersecting);
    });
};

const getObserver = () => {
    if (typeof IntersectionObserver === 'undefined') return null;
    if (!observer) observer = new IntersectionObserver(handleEntries, { rootMargin: ROOT_MARGIN });
    return observer;
};

/**
 * Ref callback that pauses the CSS animations of an element and its children
 * while the element is outside the viewport. All elements share one observer.
 * Without IntersectionObserver the element is left alone and keeps animating.
 *
 * Usage: <div ref={pauseWhenOffscreen}>. Relies on React 19 ref cleanup functions.
 */
export function pauseWhenOffscreen(node) {
    if (!node) return undefined;
    const current = getObserver();
    if (!current) return undefined;
    current.observe(node);
    watchedCount += 1;
    return () => {
        current.unobserve(node);
        node.removeAttribute(OFFSCREEN_ATTRIBUTE);
        watchedCount -= 1;
        if (watchedCount === 0) {
            current.disconnect();
            observer = null;
        }
    };
}

/**
 * Pauses every CSS animation of the page while the tab or window is hidden,
 * by setting an attribute on <html>.
 */
export function usePauseWhenPageHidden() {
    useEffect(() => {
        const root = document.documentElement;
        const sync = () => root.toggleAttribute(PAGE_HIDDEN_ATTRIBUTE, document.hidden);
        sync();
        document.addEventListener('visibilitychange', sync);
        return () => {
            document.removeEventListener('visibilitychange', sync);
            root.removeAttribute(PAGE_HIDDEN_ATTRIBUTE);
        };
    }, []);
}
