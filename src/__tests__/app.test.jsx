import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App.jsx';
import { SKILL_DATA, getTheme } from '../constants/gameData';

// Rendering the whole app and loading lazy chunks takes several seconds on a busy machine.
// The default 5 s test timeout was shorter than the 5 s waitFor inside these tests.
const APP_TEST_TIMEOUT = 20000;

describe('App', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'Audio',
            class {
                play() {
                    return Promise.resolve();
                }
                pause() {}
                addEventListener() {}
                removeEventListener() {}
            },
        );
        const store = {};
        vi.stubGlobal('localStorage', {
            getItem: (k) => (k in store ? store[k] : null),
            setItem: (k, v) => {
                store[k] = String(v);
            },
            removeItem: (k) => {
                delete store[k];
            },
            clear: () => {
                Object.keys(store).forEach((k) => delete store[k]);
            },
        });
    });

    it('module imports without error', async () => {
        const mod = await import('../App.jsx');
        expect(mod).toBeDefined();
    });

    it(
        'does not mount drawers until first opened, then lazy-loads them',
        async () => {
            localStorage.clear();
            const { container } = render(<App />);
            expect(container.querySelector('.drawer, [data-drawer]')).toBeNull();
            const buttons = container.querySelectorAll('button.absolute.z-40');
            fireEvent.click(buttons[0]);
            await waitFor(() => expect(screen.getAllByText(/volume|profile|reset/i).length).toBeGreaterThan(0), {
                timeout: 15000,
            });
        },
        APP_TEST_TIMEOUT,
    );

    it(
        'starts a battle on the centre skill and renders its real mini-game',
        async () => {
            localStorage.clear();
            const consoleError = vi.spyOn(console, 'error');
            const centre = SKILL_DATA[0];
            render(<App />);
            // The button text comes from the default theme.
            fireEvent.click(screen.getByRole('button', { name: getTheme().skills[centre.id].actionName }));
            await waitFor(() => expect(document.querySelector('.animate-in')?.children.length).toBeGreaterThan(1), {
                timeout: 15000,
            });
            expect(screen.queryByText('Game crashed!')).toBeNull();
            expect(consoleError.mock.calls.filter((args) => String(args[0]).includes('[GameError]'))).toEqual([]);
            consoleError.mockRestore();
        },
        APP_TEST_TIMEOUT,
    );

    it('shows the startup achievement toast with the load time', async () => {
        localStorage.clear();
        render(<App startupLoadSeconds={1.234} />);
        await waitFor(() => expect(screen.getByText(/loaded successfully in 1.23 seconds/)).toBeInTheDocument());
    });

    it('pauses the two invisible carousel cards and pauses the page while it is hidden', () => {
        localStorage.clear();
        const { container, unmount } = render(<App />);
        const paused = [...container.querySelectorAll('[data-offscreen]')];
        expect(paused).toHaveLength(2);
        paused.forEach((card) => expect(card.style.opacity).toBe('0'));

        Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
        fireEvent(document, new Event('visibilitychange'));
        expect(document.documentElement).toHaveAttribute('data-page-hidden');
        delete document.hidden;
        fireEvent(document, new Event('visibilitychange'));
        expect(document.documentElement).not.toHaveAttribute('data-page-hidden');
        unmount();
    });
});
