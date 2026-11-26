import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { createMemoryStorage } from '../helpers/memoryStorage';
import I18nProvider from '../../i18n/I18nProvider';
import { useTranslation } from '../../i18n/useTranslation';
import { LANGUAGE_STORAGE_KEY, getInitialLanguage } from '../../i18n/locales';
import LanguageSelector from '../../components/ui/LanguageSelector';
import ResetModal from '../../components/modals/ResetModal';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import GameErrorBoundary from '../../components/ui/GameErrorBoundary';
import LoadingScreen from '../../components/ui/LoadingScreen';

vi.mock('../../services/soundManager', () => ({ playClick: vi.fn() }));

const wrapper = ({ children }) => <I18nProvider>{children}</I18nProvider>;

const stubBrowserLanguages = (languages) => {
    vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(languages);
};

describe('I18nProvider', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
        stubBrowserLanguages(['en-US']);
        document.documentElement.lang = '';
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('uses English text without a provider', () => {
        const { result } = renderHook(() => useTranslation());
        expect(result.current.language).toBe('en');
        expect(result.current.t('settings.title')).toBe('Settings');
        expect(() => result.current.setLanguage('fr')).not.toThrow();
    });

    it('defaults to the browser language when nothing is saved', () => {
        stubBrowserLanguages(['fr-FR', 'en']);
        const { result } = renderHook(() => useTranslation(), { wrapper });
        expect(result.current.language).toBe('fr');
        expect(result.current.t('settings.title')).toBe('Paramètres');
    });

    it('falls back to English for an unsupported browser language', () => {
        stubBrowserLanguages(['de-DE']);
        expect(getInitialLanguage()).toBe('en');
    });

    it('uses navigator.language when navigator.languages is empty', () => {
        stubBrowserLanguages([]);
        vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('fr-BE');
        expect(getInitialLanguage()).toBe('fr');
    });

    it('prefers the saved language over the browser language', () => {
        stubBrowserLanguages(['en-US']);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify('fr'));
        expect(getInitialLanguage()).toBe('fr');
    });

    it('ignores a corrupted saved value', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem(LANGUAGE_STORAGE_KEY, '{broken');
        expect(getInitialLanguage()).toBe('en');
        expect(warn).toHaveBeenCalled();
    });

    it('saves the choice and restores it on the next start', () => {
        const first = renderHook(() => useTranslation(), { wrapper });
        act(() => first.result.current.setLanguage('fr'));
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('"fr"');
        first.unmount();

        const second = renderHook(() => useTranslation(), { wrapper });
        expect(second.result.current.language).toBe('fr');
    });

    it('ignores an unknown language code', () => {
        const { result } = renderHook(() => useTranslation(), { wrapper });
        act(() => result.current.setLanguage('xx'));
        expect(result.current.language).toBe('en');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
    });

    it('accepts an initial language and sets <html lang>', () => {
        const { result } = renderHook(() => useTranslation(), {
            wrapper: ({ children }) => <I18nProvider initialLanguage="fr">{children}</I18nProvider>,
        });
        expect(document.documentElement.lang).toBe('fr');
        act(() => result.current.setLanguage('en'));
        expect(document.documentElement.lang).toBe('en');
    });

    it('still switches language when storage is blocked', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.stubGlobal('localStorage', {
            getItem: () => null,
            setItem: () => {
                throw new Error('QuotaExceededError');
            },
        });
        const { result } = renderHook(() => useTranslation(), { wrapper });
        act(() => result.current.setLanguage('fr'));
        expect(result.current.language).toBe('fr');
        expect(warn).toHaveBeenCalled();
    });
});

describe('LanguageSelector', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
        stubBrowserLanguages(['en-US']);
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('lists the languages and switches the visible text of other components', () => {
        render(
            <I18nProvider>
                <LanguageSelector />
                <ResetModal isOpen onClose={() => {}} onConfirm={() => {}} />
            </I18nProvider>,
        );
        expect(screen.getByText('Delete Progress?')).toBeInTheDocument();

        const toggle = screen.getByRole('button', { name: 'Language: English' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        expect(screen.getByRole('list', { name: 'Choose a language' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(screen.getByRole('button', { name: 'Français' }));

        expect(screen.getByText('Effacer la progression ?')).toBeInTheDocument();
        expect(screen.queryByText('Delete Progress?')).toBeNull();
        expect(screen.getByRole('button', { name: 'Langue : Français' })).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('list')).toBeNull();
        expect(document.documentElement.lang).toBe('fr');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('"fr"');
    });

    it('uses the translated confirmation word in the reset modal', () => {
        const onConfirm = vi.fn();
        render(
            <I18nProvider initialLanguage="fr">
                <ResetModal isOpen onClose={() => {}} onConfirm={onConfirm} />
            </I18nProvider>,
        );
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'effacer' } });
        fireEvent.click(screen.getByRole('button', { name: 'Effacer' }));
        expect(onConfirm).toHaveBeenCalled();
    });
});

describe('translated class components and loading screen', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    const Boom = () => {
        throw new Error('');
    };

    it('shows error boundaries in French', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <I18nProvider initialLanguage="fr">
                <ErrorBoundary>
                    <Boom />
                </ErrorBoundary>
                <GameErrorBoundary gameName="math">
                    <Boom />
                </GameErrorBoundary>
            </I18nProvider>,
        );
        expect(screen.getByText('Un problème est survenu')).toBeInTheDocument();
        expect(screen.getByText('Une erreur inattendue est survenue')).toBeInTheDocument();
        expect(screen.getByText('Le jeu a planté !')).toBeInTheDocument();
    });

    it('uses plural forms on the loading screen', () => {
        const { rerender } = render(
            <I18nProvider initialLanguage="fr">
                <LoadingScreen progress={100} ready={false} failedCount={1} onContinue={() => {}} />
            </I18nProvider>,
        );
        expect(screen.getByRole('alert')).toHaveTextContent("1 IMAGE IMPORTANTE N'A PAS PU CHARGER");
        rerender(
            <I18nProvider initialLanguage="fr">
                <LoadingScreen progress={100} ready={false} failedCount={3} onContinue={() => {}} />
            </I18nProvider>,
        );
        expect(screen.getByRole('alert')).toHaveTextContent("3 IMAGES IMPORTANTES N'ONT PAS PU CHARGER");
    });
});
