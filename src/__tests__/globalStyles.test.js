import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');
const withoutComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const classesIn = (css) =>
    new Set(
        [
            ...withoutComments(css)
                .replace(/url\([^)]*\)/g, '')
                .matchAll(/\.([a-zA-Z][\w-]*)/g),
        ].map((m) => m[1]),
    );

const sourceFiles = readdirSync(root, { recursive: true })
    .filter((file) => /\.(js|jsx)$/.test(file) && !file.startsWith('__tests__'))
    .map((file) => ({ file, text: read(file) }));

const usedIn = (name) =>
    sourceFiles.filter(({ text }) => new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(text)).map(({ file }) => file);

// Each CSS module and the source files that import it.
const MODULES = {
    'App.module.css': ['App.jsx'],
    'components/ui/MobWithAura.module.css': ['components/ui/MobWithAura.jsx'],
    'components/ui/AchievementToast.module.css': ['components/ui/AchievementToast.jsx'],
    'components/skills/SkillCard.module.css': ['components/skills/SkillCard.jsx'],
    'components/skills/games/MemoryGame.module.css': ['components/skills/games/MemoryGame.jsx'],
    'components/profile/ProfileCard.module.css': ['components/profile/ProfileCard.jsx'],
    'components/drawers/CosmeticsDrawer.module.css': ['components/drawers/CosmeticsDrawer.jsx'],
    'styles/borderEffects.module.css': ['components/skills/SkillCard.jsx', 'components/drawers/CosmeticsDrawer.jsx'],
};

describe('global styles', () => {
    it('are loaded from one entry file that imports only the shared parts', () => {
        const imports = [...read('components/ui/GlobalStyles.css').matchAll(/@import '(.+?)';/g)].map((m) => m[1]);
        expect(imports).toEqual(['../../styles/base.css', '../../styles/animation-pause.css']);
    });

    it('no longer have the old global files for component styles', () => {
        ['card-borders.css', 'achievement-borders.css', 'aura-animations.css', 'auras.css'].forEach((file) =>
            expect(existsSync(join(root, 'styles', file))).toBe(false),
        );
        expect(existsSync(join(root, 'components/ui/GlobalStyles.jsx'))).toBe(false);
    });

    it('only keep classes shared by at least two source files', () => {
        const lonely = [...classesIn(read('styles/base.css'))].filter((name) => usedIn(name).length < 2);
        expect(lonely).toEqual([]);
    });

    it('pause animations, pseudo-elements included, under the pause attributes', () => {
        const css = read('styles/animation-pause.css');
        ['[data-offscreen] *::before', '[data-offscreen] *::after', 'html[data-page-hidden] *::before'].forEach((sel) =>
            expect(css).toContain(sel),
        );
        expect(css).toMatch(/animation-play-state:\s*paused !important/);
    });

    it('keep the pause rules out of base.css', () => {
        expect(read('styles/base.css')).not.toMatch(/animation-play-state/);
    });
});

describe('CSS modules', () => {
    it.each(Object.entries(MODULES))('%s is imported by its components', (module, importers) => {
        expect(existsSync(join(root, module))).toBe(true);
        const fileName = module.split('/').pop();
        importers.forEach((file) => expect(read(file)).toContain(fileName));
    });

    it.each(Object.entries(MODULES))('every class of %s is used, so no dead CSS stays', (module, importers) => {
        const code = importers.map(read).join('\n');
        // Border effect classes are built from the effect id, as `border-effect-${id}`.
        const unused = [...classesIn(read(module))].filter(
            (name) => !code.includes(name) && !(name.startsWith('border-effect-') && code.includes('border-effect-')),
        );
        expect(unused).toEqual([]);
    });

    it('has one border effect class for every effect listed in the cosmetics drawer', () => {
        const drawer = read('components/drawers/CosmeticsDrawer.jsx');
        const ids = [...drawer.matchAll(/\{ id: '([\w-]+)', (?:badge|achievement):/g)]
            .map((m) => m[1])
            .filter((id) => !id.startsWith('solid'));
        expect(ids).toHaveLength(13);
        const classes = classesIn(read('styles/borderEffects.module.css'));
        expect([...classes].sort()).toEqual(ids.map((id) => `border-effect-${id}`).sort());
    });

    it('keeps no CSS for the aura classes that nothing applied', () => {
        const all = Object.keys(MODULES).map(read).join('\n') + read('styles/base.css');
        expect(all).not.toMatch(/\.aura-[a-z]/);
        ['selected-card-glow', 'animate-spin-aura', 'toast-slide', 'aura-breathe', 'aura-pulse-spiky'].forEach((name) =>
            expect(all).not.toContain(name),
        );
    });
});
