import { getTheme, DEFAULT_THEME_ID } from '../constants/gameData';
import { parseJSON } from '../services/storage';
import { STORAGE_KEYS, skillsKey } from '../services/storageKeys';

const getSavedTheme = () => {
    try {
        const profile = Number.parseInt(localStorage.getItem(STORAGE_KEYS.currentProfile) || '1', 10) || 1;
        const saved = localStorage.getItem(skillsKey(profile));
        return parseJSON(saved, {}, 'saved theme').theme || DEFAULT_THEME_ID;
    } catch {
        return DEFAULT_THEME_ID;
    }
};

const preloadImage = (src) =>
    new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve({ src, ok: true });
        image.onerror = () => resolve({ src, ok: false });
        image.src = src;
        if (image.complete) resolve({ src, ok: image.naturalWidth > 0 });
    });

const preloadAudio = (src) =>
    new Promise((resolve) => {
        const audio = new Audio();
        const timeout = window.setTimeout(() => finish(false), 5000);
        const finish = (ok) => {
            window.clearTimeout(timeout);
            audio.removeEventListener('canplaythrough', onReady);
            audio.removeEventListener('loadeddata', onReady);
            audio.removeEventListener('error', onError);
            resolve({ src, ok });
        };
        const onReady = () => finish(true);
        const onError = () => finish(false);
        audio.preload = 'auto';
        audio.addEventListener('loadeddata', onReady, { once: true });
        audio.addEventListener('canplaythrough', onReady, { once: true });
        audio.addEventListener('error', onError, { once: true });
        audio.src = src;
        audio.load();
    });

export const preloadStartupAssets = async (onProgress = () => {}) => {
    const theme = getTheme(getSavedTheme());
    const { background, logo, cardBack } = theme.assets;
    const skillIcons = Object.values(theme.skillIcons);
    const renderedSprites = [...document.querySelectorAll('#root main img')]
        .filter((image) => {
            const bounds = image.getBoundingClientRect();
            return (
                bounds.bottom > 0 &&
                bounds.right > 0 &&
                bounds.top < window.innerHeight &&
                bounds.left < window.innerWidth
            );
        })
        .map((image) => image.currentSrc || image.src)
        .filter(Boolean);
    const imageAssets = [...new Set([background, logo, cardBack, ...skillIcons, ...renderedSprites].filter(Boolean))];
    const tasks = imageAssets.map((src) => ({ src, load: () => preloadImage(src) }));
    let completed = 0;
    const results = await Promise.all(
        tasks.map((task) =>
            task.load().then((result) => {
                completed += 1;
                onProgress({ completed, total: tasks.length, percent: Math.round((completed / tasks.length) * 100) });
                return result;
            }),
        ),
    );

    // Sound effects are useful, but are not required to show or operate the menu.
    // Warm them in the background so a slow audio decoder cannot hold startup open.
    Promise.all([...new Set(Object.values(theme.sounds))].map(preloadAudio)).then((audioResults) => {
        const failedOptional = audioResults.filter((result) => !result.ok).map((result) => result.src);
        if (failedOptional.length > 0) {
            console.warn('Optional startup sounds failed to preload:', failedOptional);
        }
    });

    return {
        total: tasks.length,
        failedCritical: results.filter((result) => !result.ok).map((result) => result.src),
    };
};
