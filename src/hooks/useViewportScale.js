import { useState, useEffect } from 'react';

// Skill cards have a fixed design size. These scales shrink them on short windows,
// so the whole game stays visible without scrolling.
export const CARD_HEIGHT = 600;
export const MIN_SCALE = 0.5;
// The centre card of the carousel is drawn 1.1 times bigger than the others.
const CENTRE_ZOOM = 1.1;
// Share of the window height given to the centre card on the main screen.
const CAROUSEL_SHARE = 0.56;
// During a battle the card is zoomed 1.5 times, with a margin above and below.
const BATTLE_ZOOM = 1.5;
const BATTLE_MARGIN = 40;

const clampScale = (scale, max) => Math.min(max, Math.max(MIN_SCALE, scale));

export const getCardScale = (windowHeight) =>
    clampScale((windowHeight * CAROUSEL_SHARE) / (CARD_HEIGHT * CENTRE_ZOOM), 1);

export const getBattleScale = (windowHeight) => clampScale((windowHeight - BATTLE_MARGIN) / CARD_HEIGHT, BATTLE_ZOOM);

const scalesFor = (windowHeight) => ({
    cardScale: getCardScale(windowHeight),
    battleScale: getBattleScale(windowHeight),
});

// Scales for the current window height, updated when the window is resized.
export const useViewportScale = () => {
    const [scales, setScales] = useState(() => scalesFor(window.innerHeight));

    useEffect(() => {
        const handleResize = () => setScales(scalesFor(window.innerHeight));
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return scales;
};
