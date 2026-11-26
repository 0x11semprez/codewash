import { describe, it, expect } from 'vitest';
import {
    buildTheme,
    resolveThemePath,
    resolveThemeId,
    getTheme,
    THEME_CONFIG,
    THEMES_LIST,
    DEFAULT_THEME_ID,
    HOSTILE_MOBS,
    FRIENDLY_MOBS,
    BASE_ASSETS,
    SKILL_DATA,
    WRITING_DIFFICULTY_POOLS,
    DEFAULT_MUSIC,
    DEFAULT_SOUNDS,
    buildWritingPools,
} from '../constants/gameData';
import { hasDefeatedWholeGroup } from '../constants/achievements';

const minimal = { name: 'Test', background: 'bg.webp', logo: 'logo.webp', cardBack: 'card.webp' };

describe('resolveThemePath', () => {
    it('puts plain file names in the theme folder', () => {
        expect(resolveThemePath('space', 'sprites/drone.webp')).toBe('assets/themes/space/sprites/drone.webp');
    });

    it('keeps shared paths as they are', () => {
        expect(resolveThemePath('space', 'assets/mobs/hostile/zombie.png')).toBe('assets/mobs/hostile/zombie.png');
    });
});

describe('buildTheme with only the required fields', () => {
    const theme = buildTheme('test', minimal);

    it('resolves the three standard pictures', () => {
        expect(theme.assets.background).toBe('assets/themes/test/bg.webp');
        expect(theme.assets.logo).toBe('assets/themes/test/logo.webp');
        expect(theme.assets.cardBack).toBe('assets/themes/test/card.webp');
        expect(theme.style.backgroundImage).toBe("url('assets/themes/test/bg.webp')");
    });

    it('falls back to the default creatures, pieces, music and sounds', () => {
        expect(theme.enemies).toBe(HOSTILE_MOBS);
        expect(theme.friends).toBe(FRIENDLY_MOBS);
        expect(theme.patternPieces).toBe(BASE_ASSETS.axolotls);
        expect(theme.bonusCreature).toBe(HOSTILE_MOBS.Phantom);
        expect(theme.milestoneContainer).toBe('Shulker Box');
        expect(theme.bossContainer).toBe('Ender Chest');
        expect(theme.music).toBe(DEFAULT_MUSIC);
        expect(theme.sounds).toEqual(DEFAULT_SOUNDS);
        expect(theme.writingPools).toBe(WRITING_DIFFICULTY_POOLS);
        expect(theme.order).toBe(99);
    });

    it('uses the skill defaults for names and texts', () => {
        SKILL_DATA.forEach((skill) => {
            expect(theme.skills[skill.id]).toEqual({
                name: skill.name,
                fantasyName: skill.fantasyName,
                actionName: skill.actionName,
                taskDescription: skill.taskDescription,
            });
            expect(theme.skillIcons[skill.id]).toBe(skill.img);
        });
    });
});

describe('buildTheme with its own content', () => {
    const theme = buildTheme('test', {
        ...minimal,
        order: 3,
        skills: { reading: { name: 'Signals', title: 'Star Library', action: 'Decode!', description: 'Read!' } },
        skillIcons: { math: 'icons/math.webp' },
        enemies: { Drone: 'sprites/drone.webp', 'Big Comet': 'sprites/comet.webp' },
        craftItems: { Bolt: 'sprites/bolt.webp' },
        containers: { Crate: 'c.webp', 'Big Crate': 'b.webp', Vault: 'v.webp' },
        milestoneContainer: 'Big Crate',
        bossContainer: 'Vault',
        patternPieces: { Red: 'red.webp' },
        bonusCreature: 'star.webp',
        music: ['music/a.mp3'],
        sounds: { click: 'sounds/click.ogg', enemyHurt: 'sounds/hurt.ogg' },
    });

    it('resolves its own pictures and keeps defaults for the rest', () => {
        expect(theme.enemies).toEqual({
            Drone: 'assets/themes/test/sprites/drone.webp',
            'Big Comet': 'assets/themes/test/sprites/comet.webp',
        });
        expect(theme.bosses).toEqual(getTheme().bosses);
        expect(theme.assets.mobs.Vault).toBe('assets/themes/test/v.webp');
        expect(theme.milestoneContainer).toBe('Big Crate');
        expect(theme.patternPieces).toEqual({ Red: 'assets/themes/test/red.webp' });
        expect(theme.bonusCreature).toBe('assets/themes/test/star.webp');
        expect(theme.skillIcons.math).toBe('assets/themes/test/icons/math.webp');
        expect(theme.skillIcons.reading).toBe(SKILL_DATA[0].img);
    });

    it('takes skill texts from the theme', () => {
        expect(theme.skills.reading).toEqual({
            name: 'Signals',
            fantasyName: 'Star Library',
            actionName: 'Decode!',
            taskDescription: 'Read!',
        });
        expect(theme.skills.math.fantasyName).toBe(SKILL_DATA[1].fantasyName);
    });

    it('merges its sounds over the default sounds and uses its own music', () => {
        expect(theme.music).toEqual(['assets/themes/test/music/a.mp3']);
        expect(theme.sounds.click).toBe('assets/themes/test/sounds/click.ogg');
        expect(theme.sounds.enemyHurt).toBe('assets/themes/test/sounds/hurt.ogg');
        expect(theme.sounds.fail).toBe(DEFAULT_SOUNDS.fail);
    });

    it('builds spelling words from its own pictures', () => {
        const words = Object.values(theme.writingPools).flat();
        const names = words.map((word) => word.displayName);
        expect(names).toContain('Drone');
        expect(names).toContain('Bolt');
        const comet = words.find((word) => word.displayName === 'Big Comet');
        expect(comet).toMatchObject({
            word: 'bigcomet',
            length: 8,
            imagePath: 'assets/themes/test/sprites/comet.webp',
        });
        expect(names).not.toContain('Zombie');
    });
});

describe('buildWritingPools', () => {
    it('gives the whole list to a difficulty with no word of the right length', () => {
        const index = [{ word: 'cat', displayName: 'Cat', length: 3, imagePath: 'cat.png' }];
        const pools = buildWritingPools(index);
        expect(pools[1]).toEqual(index);
        expect(pools[5]).toEqual(index);
    });
});

describe('theme registry', () => {
    it('loads every theme JSON file, in menu order', () => {
        expect(THEMES_LIST.map((theme) => theme.id)).toEqual(['minecraft', 'kpop', 'pokemon', 'spy', 'space', 'ocean']);
        THEMES_LIST.forEach((item) => expect(item.img).toBe(THEME_CONFIG[item.id].assets.background));
    });

    it('resolves unknown or empty theme ids to the default theme', () => {
        expect(resolveThemeId('space')).toBe('space');
        expect(resolveThemeId('removed-theme')).toBe(DEFAULT_THEME_ID);
        expect(resolveThemeId(undefined)).toBe(DEFAULT_THEME_ID);
        expect(getTheme('removed-theme')).toBe(THEME_CONFIG.minecraft);
        expect(getTheme()).toBe(THEME_CONFIG.minecraft);
    });

    it('gives the new themes their own creatures, sounds and music', () => {
        ['space', 'ocean'].forEach((id) => {
            const theme = THEME_CONFIG[id];
            expect(Object.values(theme.enemies).every((path) => path.startsWith(`assets/themes/${id}/`))).toBe(true);
            expect(Object.values(theme.friends).every((path) => path.startsWith(`assets/themes/${id}/`))).toBe(true);
            expect(theme.music.every((path) => path.startsWith(`assets/themes/${id}/music/`))).toBe(true);
            expect(theme.sounds.enemyHurt).toMatch(`assets/themes/${id}/sounds/`);
            expect(theme.skills.writing.fantasyName).not.toBe('Crafting Table');
        });
    });

    it('keeps the Minecraft wording inside the Minecraft theme only', () => {
        expect(THEME_CONFIG.minecraft.skills.writing.fantasyName).toBe('Crafting Table');
        expect(THEME_CONFIG.kpop.skills.writing.fantasyName).toBe('Workshop');
        SKILL_DATA.forEach((skill) => {
            expect(`${skill.fantasyName} ${skill.taskDescription}`).not.toMatch(/redstone|enchant|crafting table/i);
        });
    });
});

describe('hasDefeatedWholeGroup', () => {
    it('is true once every boss of one theme is defeated', () => {
        expect(hasDefeatedWholeGroup(Object.keys(THEME_CONFIG.space.bosses), 'bosses')).toBe(true);
        expect(hasDefeatedWholeGroup(Object.keys(THEME_CONFIG.minecraft.bosses), 'bosses')).toBe(true);
    });

    it('does not mix themes', () => {
        const mixed = [
            ...Object.keys(THEME_CONFIG.space.bosses).slice(1),
            ...Object.keys(THEME_CONFIG.ocean.bosses).slice(1),
        ];
        expect(hasDefeatedWholeGroup(mixed, 'bosses')).toBe(false);
        expect(hasDefeatedWholeGroup([], 'enemies')).toBe(false);
    });
});
