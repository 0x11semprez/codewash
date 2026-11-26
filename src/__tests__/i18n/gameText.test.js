import { describe, it, expect, vi, afterEach } from 'vitest';
import { mobNameWithAura } from '../../i18n/gameText';
import { createTranslator, DEFAULT_LOCALE } from '../../i18n/translate';
import { LOCALES } from '../../i18n/locales';

const t = createTranslator(DEFAULT_LOCALE, LOCALES);

describe('mobNameWithAura', () => {
    it('keeps the plain mob name when the mob has no aura', () => {
        expect(mobNameWithAura(t, 'Zombie', null)).toBe('Zombie');
    });

    it('adds the translated aura adjective when the mob has one', () => {
        expect(mobNameWithAura(t, 'Zombie', 'frost')).toBe('Frozen Zombie');
    });
});

describe('missing key warnings', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('are on in development builds', async () => {
        vi.stubEnv('DEV', true);
        vi.resetModules();
        const { devMissingKeyWarner } = await import('../../i18n/I18nContext');
        expect(typeof devMissingKeyWarner).toBe('function');
    });

    it('are off in production builds', async () => {
        vi.stubEnv('DEV', false);
        vi.resetModules();
        const { devMissingKeyWarner } = await import('../../i18n/I18nContext');
        expect(devMissingKeyWarner).toBeUndefined();
    });
});
