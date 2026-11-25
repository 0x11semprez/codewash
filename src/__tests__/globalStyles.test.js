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
});
