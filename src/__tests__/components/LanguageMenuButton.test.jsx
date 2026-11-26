import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageMenuButton from '../../components/ui/LanguageMenuButton';
import I18nProvider from '../../i18n/I18nProvider';
import { I18nContext } from '../../i18n/I18nContext';
import { LANGUAGE_STORAGE_KEY, LANGUAGES, LOCALES } from '../../i18n/locales';
import { createTranslator, DEFAULT_LOCALE } from '../../i18n/translate';
import { createMemoryStorage } from '../helpers/memoryStorage';

vi.mock('../../services/soundManager', () => ({ playClick: vi.fn() }));

describe('LanguageMenuButton', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    const renderInProvider = () =>
        render(
            <I18nProvider initialLanguage="en">
                <LanguageMenuButton />
                <p>outside</p>
            </I18nProvider>,
        );

    it('opens the list, focuses the current language and switches the language', () => {
        renderInProvider();
        const toggle = screen.getByRole('button', { name: 'Change language (current: English)' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('list')).toBeNull();

        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'true');
        const list = screen.getByRole('list', { name: 'Choose a language' });
        expect(toggle).toHaveAttribute('aria-controls', list.id);
        expect(list.querySelectorAll('button')).toHaveLength(LANGUAGES.length);
        const english = screen.getByRole('button', { name: 'English' });
        expect(english).toHaveAttribute('aria-pressed', 'true');
        expect(english).toHaveFocus();

        fireEvent.click(screen.getByRole('button', { name: 'Français' }));
        const frenchToggle = screen.getByRole('button', { name: 'Changer de langue (actuelle : Français)' });
        expect(frenchToggle).toHaveAttribute('aria-expanded', 'false');
        expect(frenchToggle).toHaveFocus();
        expect(screen.queryByRole('list')).toBeNull();
        expect(document.documentElement.lang).toBe('fr');
        expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('"fr"');
    });

    it('closes the list with Escape and gives focus back to the button', () => {
        renderInProvider();
        const toggle = screen.getByRole('button', { name: /Change language/ });
        // Escape does nothing while the list is closed.
        fireEvent.keyDown(toggle, { key: 'Escape' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');

        fireEvent.click(toggle);
        fireEvent.keyDown(screen.getByRole('button', { name: 'English' }), { key: 'Enter' });
        expect(screen.getByRole('list')).toBeInTheDocument();
        fireEvent.keyDown(screen.getByRole('button', { name: 'English' }), { key: 'Escape' });
        expect(screen.queryByRole('list')).toBeNull();
        expect(toggle).toHaveFocus();
    });

    it('closes the list on a click outside, not on a click inside', () => {
        renderInProvider();
        const toggle = screen.getByRole('button', { name: /Change language/ });
        fireEvent.click(toggle);
        fireEvent.pointerDown(screen.getByRole('button', { name: 'English' }));
        expect(screen.getByRole('list')).toBeInTheDocument();
        fireEvent.pointerDown(screen.getByText('outside'));
        expect(screen.queryByRole('list')).toBeNull();
    });

    it('toggles the list closed with the button', () => {
        renderInProvider();
        const toggle = screen.getByRole('button', { name: /Change language/ });
        fireEvent.click(toggle);
        fireEvent.click(toggle);
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
        expect(screen.queryByRole('list')).toBeNull();
    });

    it('falls back to the first language when the current code is unknown', () => {
        const setLanguage = vi.fn();
        render(
            <I18nContext.Provider
                value={{
                    language: 'xx',
                    languages: LANGUAGES,
                    setLanguage,
                    t: createTranslator(DEFAULT_LOCALE, LOCALES),
                }}
            >
                <LanguageMenuButton />
            </I18nContext.Provider>,
        );
        const toggle = screen.getByRole('button', { name: `Change language (current: ${LANGUAGES[0].name})` });
        fireEvent.click(toggle);
        screen.getAllByRole('button', { pressed: false }).forEach((button) => expect(button).not.toHaveFocus());
        fireEvent.click(screen.getByRole('button', { name: LANGUAGES[0].name }));
        expect(setLanguage).toHaveBeenCalledWith(LANGUAGES[0].code);
    });
});
