import React from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AchievementToast from '../../components/ui/AchievementToast';
import ErrorBoundary from '../../components/ui/ErrorBoundary';
import GameErrorBoundary from '../../components/ui/GameErrorBoundary';
import { getTrackedErrors } from '../../services/errorTracker';
import { createMemoryStorage } from '../helpers/memoryStorage';
import LanguageSelector from '../../components/ui/LanguageSelector';
import MobWithAura from '../../components/ui/MobWithAura';
import { I18nContext } from '../../i18n/I18nContext';
import { LANGUAGES, LOCALES } from '../../i18n/locales';
import { createTranslator, DEFAULT_LOCALE } from '../../i18n/translate';

vi.mock('../../services/soundManager', () => ({ playClick: vi.fn() }));

afterEach(() => {
    vi.restoreAllMocks();
});

describe('AchievementToast', () => {
    it('renders nothing for an unknown achievement', () => {
        const { container } = render(<AchievementToast achievementId="no_such_achievement" />);
        expect(container).toBeEmptyDOMElement();
    });
});

describe('error boundaries report to the error tracker', () => {
    const Boom = () => {
        throw new Error('tracked crash');
    };

    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
    });

    it('GameErrorBoundary tracks the crash with the game name', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <GameErrorBoundary gameName="memory">
                <Boom />
            </GameErrorBoundary>,
        );
        const [entry] = getTrackedErrors();
        expect(entry.source).toBe('game:memory');
        expect(entry.message).toBe('tracked crash');
        expect(entry.componentStack).toContain('Boom');
    });

    it('GameErrorBoundary tracks an unnamed game as unknown', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <GameErrorBoundary>
                <Boom />
            </GameErrorBoundary>,
        );
        expect(getTrackedErrors()[0].source).toBe('game:unknown');
    });

    it('ErrorBoundary tracks the crash', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <I18nContext.Provider value={{ t: (key) => key }}>
                <ErrorBoundary>
                    <Boom />
                </ErrorBoundary>
            </I18nContext.Provider>,
        );
        const [entry] = getTrackedErrors();
        expect(entry.source).toBe('react');
        expect(entry.message).toBe('tracked crash');
    });
});

describe('GameErrorBoundary', () => {
    let crash = true;
    const MaybeBoom = () => {
        if (crash) throw new Error('broken game');
        return <p>game is back</p>;
    };

    it('logs the crash as Unknown when the game has no name, and retries', () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        const onError = vi.fn();
        crash = true;
        render(
            <GameErrorBoundary onError={onError}>
                <MaybeBoom />
            </GameErrorBoundary>,
        );
        expect(error).toHaveBeenCalledWith('[GameError] Unknown:', expect.any(Error), expect.anything());

        crash = false;
        fireEvent.click(screen.getByRole('button'));
        expect(onError).toHaveBeenCalledOnce();
        expect(screen.getByText('game is back')).toBeInTheDocument();
    });

    it('retries without an onError callback', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        crash = true;
        render(
            <GameErrorBoundary gameName="math">
                <MaybeBoom />
            </GameErrorBoundary>,
        );
        crash = false;
        fireEvent.click(screen.getByRole('button'));
        expect(screen.getByText('game is back')).toBeInTheDocument();
    });
});

describe('LanguageSelector', () => {
    it('shows the first language when the current one is not in the list', () => {
        const value = {
            language: 'xx',
            languages: LANGUAGES,
            setLanguage: vi.fn(),
            t: createTranslator(DEFAULT_LOCALE, LOCALES),
        };
        render(
            <I18nContext.Provider value={value}>
                <LanguageSelector />
            </I18nContext.Provider>,
        );
        expect(screen.getByRole('button', { name: `Language: ${LANGUAGES[0].name}` })).toBeInTheDocument();
    });
});

describe('MobWithAura', () => {
    it('shakes and glows while the boss heals', () => {
        const { container } = render(<MobWithAura mobSrc="boss.png" aura="frost" displayName="Boss" bossHealing />);
        const image = container.querySelector('.mob-image');
        expect(image.className).toContain('animate-shake');
        expect(image.className).toContain('brightness-150');
        expect(image.className).not.toContain('animate-bob');
    });
});
