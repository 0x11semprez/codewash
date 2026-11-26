// Visual themes. Each theme is one JSON file in src/themes/ and one folder in public/assets/themes/.
// This module reads every JSON file and fills the parts a theme leaves out with the default content.
// The guide for adding a theme is docs/features/themes.md.
import { BASE_ASSETS } from './items';
import { BOSS_MOBS, CHEST_BLOCKS, FRIENDLY_MOBS, HOSTILE_MOBS, MINIBOSS_MOBS } from './mobs';
import { SKILL_DATA } from './skills';
import { WRITING_DIFFICULTY_POOLS, buildWritingPools } from './words';
import { DEFAULT_MUSIC, DEFAULT_SOUNDS } from './audio';

export const DEFAULT_THEME_ID = 'minecraft';

// Content used when a theme does not list its own. The groups are swapped as a whole,
// so a theme never mixes its own enemies with default enemies.
const DEFAULT_CONTENT = {
    enemies: HOSTILE_MOBS,
    minibosses: MINIBOSS_MOBS,
    bosses: BOSS_MOBS,
    friends: FRIENDLY_MOBS,
    craftItems: {},
    containers: CHEST_BLOCKS,
    milestoneContainer: 'Shulker Box',
    bossContainer: 'Ender Chest',
    patternPieces: BASE_ASSETS.axolotls,
    bonusCreature: HOSTILE_MOBS.Phantom,
};

// Groups of named pictures. Their names are shown in battle and used as spelling words.
export const THEME_SPRITE_GROUPS = ['enemies', 'minibosses', 'bosses', 'friends', 'craftItems', 'containers'];

const DEFAULT_SKILL_ICONS = Object.fromEntries(SKILL_DATA.map((skill) => [skill.id, skill.img]));

// A file name in a theme JSON is relative to the theme folder. A path that starts with
// "assets/" points to a shared file instead.
export const resolveThemePath = (themeId, file) =>
    file.startsWith('assets/') ? file : `assets/themes/${themeId}/${file}`;

const resolveMap = (themeId, map) =>
    Object.fromEntries(Object.entries(map).map(([name, file]) => [name, resolveThemePath(themeId, file)]));

const buildSkills = (rawSkills = {}) =>
    Object.fromEntries(
        SKILL_DATA.map((skill) => {
            const raw = rawSkills[skill.id] || {};
            return [
                skill.id,
                {
                    name: raw.name || skill.name,
                    fantasyName: raw.title || skill.fantasyName,
                    actionName: raw.action || skill.actionName,
                    taskDescription: raw.description || skill.taskDescription,
                },
            ];
        }),
    );

const toWordIndex = (groups) => {
    const seen = new Set();
    return groups
        .flatMap((group) => Object.entries(group))
        .filter(([name]) => !seen.has(name) && seen.add(name))
        .map(([name, imagePath]) => ({
            word: name.toLowerCase().replace(/\s/g, ''),
            displayName: name,
            length: name.replace(/\s/g, '').length,
            imagePath,
        }));
};

export const buildTheme = (id, raw) => {
    const own = (key) => (raw[key] ? resolveMap(id, raw[key]) : null);
    const groups = Object.fromEntries(THEME_SPRITE_GROUPS.map((key) => [key, own(key) || DEFAULT_CONTENT[key]]));
    const hasOwnSprites = THEME_SPRITE_GROUPS.some((key) => raw[key]);
    const usesOwnContainers = Boolean(raw.containers);
    const background = resolveThemePath(id, raw.background);
    const ownSounds = raw.sounds ? resolveMap(id, raw.sounds) : {};

    return {
        id,
        name: raw.name,
        order: raw.order ?? 99,
        style: {
            backgroundImage: `url('${background}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        assets: {
            background,
            logo: resolveThemePath(id, raw.logo),
            cardBack: resolveThemePath(id, raw.cardBack),
            mobs: Object.assign({}, ...THEME_SPRITE_GROUPS.map((key) => groups[key])),
        },
        skills: buildSkills(raw.skills),
        skillIcons: { ...DEFAULT_SKILL_ICONS, ...(own('skillIcons') || {}) },
        ...groups,
        milestoneContainer: usesOwnContainers ? raw.milestoneContainer : DEFAULT_CONTENT.milestoneContainer,
        bossContainer: usesOwnContainers ? raw.bossContainer : DEFAULT_CONTENT.bossContainer,
        patternPieces: own('patternPieces') || DEFAULT_CONTENT.patternPieces,
        bonusCreature: raw.bonusCreature ? resolveThemePath(id, raw.bonusCreature) : DEFAULT_CONTENT.bonusCreature,
        music: raw.music?.length ? raw.music.map((file) => resolveThemePath(id, file)) : DEFAULT_MUSIC,
        sounds: { ...DEFAULT_SOUNDS, ...ownSounds },
        writingPools: hasOwnSprites
            ? buildWritingPools(toWordIndex(THEME_SPRITE_GROUPS.map((key) => groups[key])))
            : WRITING_DIFFICULTY_POOLS,
    };
};

// Every src/themes/<id>.json file becomes a theme. The file name is the theme id.
const themeFiles = import.meta.glob('../../themes/*.json', { eager: true, import: 'default' });

export const THEME_SOURCES = Object.fromEntries(
    Object.entries(themeFiles).map(([path, raw]) => [path.match(/([\w-]+)\.json$/)[1], raw]),
);

export const THEME_CONFIG = Object.fromEntries(
    Object.entries(THEME_SOURCES)
        .map(([id, raw]) => buildTheme(id, raw))
        .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
        .map((theme) => [theme.id, theme]),
);

// The theme menu, in menu order. img is the picture shown on the menu button.
export const THEMES_LIST = Object.values(THEME_CONFIG).map((theme) => ({
    id: theme.id,
    name: theme.name,
    img: theme.assets.background,
}));

// A saved theme can point to a theme that no longer exists. Fall back to the default one.
export const resolveThemeId = (id) => (id && THEME_CONFIG[id] ? id : DEFAULT_THEME_ID);

export const getTheme = (id) => THEME_CONFIG[resolveThemeId(id)];
