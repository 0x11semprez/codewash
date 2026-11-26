import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const read = (file) => readFileSync(join(root, file), 'utf8');

const PARTS = [
    ['base.css', '.animate-knockback'],
    ['card-borders.css', '.border-gold'],
    ['aura-animations.css', '@keyframes'],
    ['auras.css', '.mob-with-aura-container'],
    ['achievement-borders.css', '.border-effect-livewire'],
    ['animation-pause.css', '[data-offscreen]'],
];

describe('global styles', () => {
    it('are loaded from one entry file that imports every part in order', () => {
        const imports = [...read('components/ui/GlobalStyles.css').matchAll(/@import '(.+?)';/g)].map((m) => m[1]);
        expect(imports).toEqual(PARTS.map(([file]) => `../../styles/${file}`));
    });

    it.each(PARTS)('part %s exists and is not empty', (file, selector) => {
        expect(existsSync(join(root, 'styles', file))).toBe(true);
        expect(read(`styles/${file}`)).toContain(selector);
    });

    it('keeps every part under 700 lines', () => {
        PARTS.forEach(([file]) => expect(read(`styles/${file}`).split('\n').length).toBeLessThan(700));
    });

    it('no longer has the unused GlobalStyles.jsx copy', () => {
        expect(existsSync(join(root, 'components/ui/GlobalStyles.jsx'))).toBe(false);
    });

    it('pauses animations, pseudo-elements included, under the pause attributes', () => {
        const css = read('styles/animation-pause.css');
        ['[data-offscreen] *::before', '[data-offscreen] *::after', 'html[data-page-hidden] *::before'].forEach((sel) =>
            expect(css).toContain(sel),
        );
        expect(css).toMatch(/animation-play-state:\s*paused !important/);
    });

    it('keeps the pause rules out of the keyframes of the other parts', () => {
        PARTS.slice(0, -1).forEach(([file]) => expect(read(`styles/${file}`)).not.toMatch(/animation-play-state/));
    });
});
