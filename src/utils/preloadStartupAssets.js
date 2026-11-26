import { SKILL_DATA, THEME_CONFIG, THEMES_LIST } from '../constants/gameData';
import { parseJSON } from '../services/storage';
import { STORAGE_KEYS, skillsKey } from '../services/storageKeys';

const UI_SOUND_ASSETS = [
    'assets/sounds/ui/ui/actioncard_left.wav',
    'assets/sounds/ui/ui/actioncard_right.wav',
    'assets/sounds/ui/ui/click.wav',
    'assets/sounds/ui/ui/death.wav',
    'assets/sounds/ui/ui/fail.wav',
    'assets/sounds/ui/ui/levelup.wav',
    'assets/sounds/ui/ui/notification.wav',
    'assets/sounds/ui/ui/successful_hit.wav',
];

const getSavedTheme = () => {
    try {
        const profile = Number.parseInt(localStorage.getItem(STORAGE_KEYS.currentProfile) || '1', 10) || 1;
        const saved = localStorage.getItem(skillsKey(profile));
        return parseJSON(saved, {}, 'saved theme').theme || 'minecraft';
    } catch {
        return 'minecraft';
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
    const themeId = getSavedTheme();
    const theme = THEME_CONFIG[themeId] || THEME_CONFIG.minecraft;
    const themeListEntry = THEMES_LIST.find((item) => item.id === themeId) || THEMES_LIST[0];
    const background = theme.style?.backgroundImage?.match(/url\(['"]?(.*?)['"]?\)/)?.[1] || themeListEntry?.img;
    const logo = theme.assets?.logo;
    const cardBack = theme.assets?.cardBack;
    const skillIcons = SKILL_DATA.map((skill) => skill.img);
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
    Promise.all(UI_SOUND_ASSETS.map(preloadAudio)).then((audioResults) => {
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
