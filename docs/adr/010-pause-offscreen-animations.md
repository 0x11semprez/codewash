# ADR-010: Pause animations that nobody can see

## Status

Accepted

## Date

2026-11-25

## Context

The game feels slow. The global styles in `src/styles/` hold about 40 `infinite` CSS animations. At least 20 of them animate `filter` or `box-shadow`. The browser cannot hand these properties to the compositor, so it repaints them on the main thread on every frame.

These animations keep running when nobody can see them:

- Carousel cards outside the viewport, and the two cards at offset 3 that have `opacity: 0`.
- The Cosmetics drawer, which stays mounted when closed and slides to `-100%`. Its previews use every border effect.
- The Settings drawer, which holds the profile cards with a scrolling skill strip and a rainbow ring.
- The whole page while the tab or the Electron window is hidden.

The team wants to keep the author's visual style. The keyframes must not change.

## Decision

Pause hidden animations with `animation-play-state: paused`. Do not touch the keyframes.

- `src/hooks/useAnimationPause.js` exports `pauseWhenOffscreen`, a ref callback. It uses one shared `IntersectionObserver` for every watched element. It sets `data-offscreen` on an element when it leaves the viewport and removes it when the element comes back. The observer disconnects when the last element unmounts.
- The same file exports `usePauseWhenPageHidden()`. It listens to `visibilitychange` and sets `data-page-hidden` on `<html>` while `document.hidden` is true. `App` calls it once.
- `src/styles/animation-pause.css` pauses every animation under these attributes, on the element, its children and their `::before` and `::after`. Most auras live in pseudo-elements, so `[data-offscreen] *` alone is not enough.
- The rule uses `!important`. The `animation` shorthand in the other parts resets `animation-play-state`, often with a more specific selector such as `.mob-with-aura-container[data-aura='frost']::before`.
- The ref is placed on the roots that carry heavy animations: the `SkillCard` card, `MobWithAura`, the `CosmeticsDrawer` panel and `ProfileCard`. `App` also sets `data-offscreen` on the carousel cards at offset 3, because they are transparent but can still be inside the viewport on a wide screen.
- The observer uses `rootMargin: '-1px'`. The spec counts an element that only touches the viewport edge as intersecting. A closed drawer touches the left edge, so without the margin it would never pause.
- When `IntersectionObserver` does not exist, as in jsdom, nothing is set and every animation keeps running.

We used a ref callback instead of a `useEffect(ref)` hook. `SkillCard` moves its card into a portal when a battle starts, so the DOM node changes while the component stays mounted. An effect keyed on the ref object would keep watching the old node. React 19 runs the cleanup returned by a ref callback, so the observer follows the node.

We did not rewrite the animations to use `transform` and `opacity`. That would be cheaper, but it changes how they look.

We did not add a `prefers-reduced-motion` rule. It would change the visuals for those players, and nobody asked for it.

## Consequences

### Positive

- Off-screen and hidden animations stop repainting. A paused animation resumes from the same frame, so nothing jumps.
- One observer and one CSS file cover every component. A new component only needs `ref={pauseWhenOffscreen}`.
- Tests and old browsers behave as before.

### Negative

- Visible animations still repaint `filter` and `box-shadow` every frame. The center card and the visible mobs cost the same as before.
- The rule uses `!important` and universal selectors. It pauses every animation inside a hidden subtree, Tailwind ones included. A future animation that must keep running off-screen will need its own exception.
- Browsers already throttle hidden tabs. The page-hidden rule mainly helps Electron and browsers that keep painting a minimized window.
- In headless Chromium at 1280 x 720, 15 to 18 of 37 animations still run after the change, against 37 before. Frame time was not measured on a quiet machine. `docs/missions/performance.md` section 4.6 gives both protocols.
