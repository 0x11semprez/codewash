// App wiring: buttons, backdrops, carousel, battle overlays and the stats the app saves.
// The drawers, modals and mini-games have their own tests, so here they are small stand-ins
// that show the props App gives them. The skill cards are the real ones.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { createMemoryStorage } from './helpers/memoryStorage';
import { skillsKey } from '../services/storageKeys';
import { SKILL_DATA, getTheme } from '../constants/gameData';

const stand = vi.hoisted(() => ({
    // A stand-in that lists its boolean "isOpen" and exposes some callbacks as buttons.
    drawer:
        (name, actions = () => []) =>
        (props) => (
            <div data-testid={name} data-open={String(props.isOpen)}>
                {actions(props).map(([label, run]) => (
                    <button key={label} onClick={run}>
                        {label}
                    </button>
                ))}
            </div>
        ),
}));

vi.mock('../components/drawers/SettingsDrawer', () => ({
    default: stand.drawer('settings', (p) => [['open reset', p.onReset]]),
}));
vi.mock('../components/drawers/MenuDrawer', () => ({ default: stand.drawer('menu') }));
vi.mock('../components/drawers/CosmeticsDrawer', () => ({
    default: stand.drawer('cosmetics', (p) => [
        ['same theme', () => p.setActiveTheme(p.activeTheme)],
        ['space theme', () => p.setActiveTheme('space')],
        ['same border', () => p.setSelectedBorder(p.selectedBorder)],
        ['fire border', () => p.setSelectedBorder('fire')],
    ]),
}));
vi.mock('../components/modals/ResetModal', () => ({
    default: stand.drawer('reset', (p) => [['close reset', p.onClose]]),
}));
vi.mock('../components/modals/BugReportModal', () => ({
    default: stand.drawer('bug report', (p) => [['close bug report', p.onClose]]),
}));
const game = vi.hoisted(() => (name) => ({
    default: ({ onMathSubmit, onMicClick, spokenText }) => (
        <div data-testid={`game-${name}`}>
            <button onClick={() => onMathSubmit('WRONG')}>wrong answer</button>
            <button onClick={() => onMathSubmit('WIN')}>right answer</button>
            {onMicClick && <button onClick={onMicClick}>mic</button>}
            <p>{spokenText}</p>
        </div>
    ),
}));
vi.mock('../components/skills/games/MemoryGame', () => game('memory'));
vi.mock('../components/skills/games/PatternGame', () => game('patterns'));
vi.mock('../components/skills/games/MathGame', () => game('math'));
vi.mock('../components/skills/games/WritingGame', () => game('writing'));
vi.mock('../components/skills/games/ReadingGame', () => game('reading'));
vi.mock('../components/skills/games/CleaningGame', () => game('cleaning'));

import App from '../App.jsx';

const LAZY_TIMEOUT = { timeout: 10000 };
const TEST_TIMEOUT = 20000;
const savedGame = () => JSON.parse(localStorage.getItem(skillsKey(1)));
const button = (name) => screen.getByRole('button', { name });
const centre = SKILL_DATA[0];
const actionName = (skillId) => getTheme().skills[skillId].actionName;

beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
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
});
afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('App drawers and modals', () => {
    it(
        'opens each drawer from its button and closes it from the backdrop',
        async () => {
            const { container } = render(<App />);
            const backdrop = () => container.querySelector('.fixed.inset-0.bg-black\\/50');

            fireEvent.click(button('Open settings'));
            expect(await screen.findByTestId('settings', {}, LAZY_TIMEOUT)).toHaveAttribute('data-open', 'true');
            fireEvent.click(backdrop());
            expect(screen.getByTestId('settings')).toHaveAttribute('data-open', 'false');

            fireEvent.click(button('Open themes and cosmetics'));
            expect(await screen.findByTestId('cosmetics', {}, LAZY_TIMEOUT)).toHaveAttribute('data-open', 'true');
            fireEvent.click(backdrop());
            expect(screen.getByTestId('cosmetics')).toHaveAttribute('data-open', 'false');

            fireEvent.click(button('Open achievements'));
            expect(await screen.findByTestId('menu', {}, LAZY_TIMEOUT)).toHaveAttribute('data-open', 'true');
            fireEvent.click(backdrop());
            expect(screen.getByTestId('menu')).toHaveAttribute('data-open', 'false');
            expect(backdrop()).toBeNull();
        },
        TEST_TIMEOUT,
    );

    it(
        'opens the reset modal from the settings and closes it',
        async () => {
            render(<App />);
            fireEvent.click(button('Open settings'));
            fireEvent.click(await screen.findByText('open reset', {}, LAZY_TIMEOUT));
            fireEvent.click(await screen.findByText('close reset', {}, LAZY_TIMEOUT));
            expect(screen.queryByTestId('reset')).toBeNull();
        },
        TEST_TIMEOUT,
    );

    it(
        'opens the bug report form and closes it',
        async () => {
            render(<App />);
            fireEvent.click(button('Report a bug'));
            fireEvent.click(await screen.findByText('close bug report', {}, LAZY_TIMEOUT));
            expect(screen.queryByTestId('bug report')).toBeNull();
        },
        TEST_TIMEOUT,
    );

    it(
        'counts a theme or border change only when it really changes',
        async () => {
            render(<App />);
            fireEvent.click(button('Open themes and cosmetics'));
            fireEvent.click(await screen.findByText('same theme', {}, LAZY_TIMEOUT));
            fireEvent.click(screen.getByText('same border'));
            expect(savedGame().stats.themeChanges ?? 0).toBe(0);
            expect(savedGame().stats.borderChanges ?? 0).toBe(0);

            fireEvent.click(screen.getByText('space theme'));
            fireEvent.click(screen.getByText('fire border'));
            expect(savedGame().theme).toBe('space');
            expect(savedGame().stats.themeChanges).toBe(1);
            expect(savedGame().stats.borderChanges).toBe(1);
        },
        TEST_TIMEOUT,
    );
});

describe('App fullscreen button', () => {
    afterEach(() => {
        delete document.fullscreenElement;
        delete document.documentElement.requestFullscreen;
    });

    it('switches its label when the page goes fullscreen', () => {
        let element = null;
        Object.defineProperty(document, 'fullscreenElement', { configurable: true, get: () => element });
        document.documentElement.requestFullscreen = vi.fn().mockResolvedValue();
        render(<App />);
        fireEvent.click(button('Enter fullscreen'));
        expect(document.documentElement.requestFullscreen).toHaveBeenCalledOnce();
        element = document.documentElement;
        act(() => document.dispatchEvent(new Event('fullscreenchange')));
        expect(button('Exit fullscreen')).toHaveAttribute('title', 'Exit fullscreen');
    });
});

describe('App startup achievement', () => {
    it('does not add "game loaded" twice to the saved achievements', () => {
        localStorage.setItem(
            skillsKey(1),
            JSON.stringify({ skills: {}, stats: { achievementsUnlocked: ['game_loaded'] } }),
        );
        render(<App startupLoadSeconds={0.5} />);
        expect(savedGame().stats.achievementsUnlocked).toEqual(['game_loaded']);
    });

    it('starts the achievement list of an old save that has none', () => {
        localStorage.setItem(skillsKey(1), JSON.stringify({ skills: {}, stats: { achievementsUnlocked: 'bad' } }));
        render(<App startupLoadSeconds={0.5} />);
        expect(savedGame().stats.achievementsUnlocked).toEqual(['game_loaded']);
    });
});

describe('App carousel', () => {
    const track = (container) => container.querySelector('.perspective-1000');
    const centreAction = () => screen.getByText(actionName(SKILL_DATA[1].id));

    it('turns with a mouse drag and shows the grabbing cursor while dragging', () => {
        const { container } = render(<App />);
        expect(track(container).style.cursor).toBe('grab');
        fireEvent.mouseDown(track(container), { clientX: 500 });
        expect(track(container).style.cursor).toBe('grabbing');
        fireEvent.mouseMove(track(container), { clientX: 350 });
        fireEvent.mouseUp(track(container));
        expect(track(container).style.cursor).toBe('grab');
        expect(centreAction().closest('[style*="scale(1.1)"]')).not.toBeNull();
    });

    it('turns with a touch drag', () => {
        const { container } = render(<App />);
        fireEvent.touchStart(track(container), { touches: [{ clientX: 500 }] });
        fireEvent.touchMove(track(container), { touches: [{ clientX: 350 }] });
        fireEvent.touchEnd(track(container));
        fireEvent.mouseLeave(track(container));
        expect(centreAction().closest('[style*="scale(1.1)"]')).not.toBeNull();
    });

    it('brings a side card to the center when it is clicked', () => {
        render(<App />);
        fireEvent.click(screen.getByText(getTheme().skills[SKILL_DATA[1].id].taskDescription));
        expect(centreAction().closest('[style*="scale(1.1)"]')).not.toBeNull();
    });
});

describe('App skill cards', () => {
    it('shows the boss and miniboss auras of the saved progress', () => {
        localStorage.setItem(
            skillsKey(1),
            JSON.stringify({
                skills: {
                    [centre.id]: { level: 20, currentBossAura: 'frost' },
                    [SKILL_DATA[1].id]: { level: 10, currentMinibossAura: 'lava' },
                },
            }),
        );
        const { container } = render(<App />);
        expect(container.querySelector('[data-aura="frost"]')).not.toBeNull();
        expect(container.querySelector('[data-aura="lava"]')).not.toBeNull();
    });

    it('shows difficulty 1 for a skill saved with difficulty 0, and changes it', () => {
        localStorage.setItem(skillsKey(1), JSON.stringify({ skills: { [centre.id]: { level: 45, difficulty: 0 } } }));
        render(<App />);
        expect(screen.getAllByAltText('Difficulty 1').length).toBeGreaterThan(0);
        fireEvent.click(screen.getAllByRole('button', { name: 'Raise difficulty' })[0]);
        expect(Object.values(savedGame().skills).some((skill) => skill.difficulty === 2)).toBe(true);
    });
});

describe('App battle', () => {
    const startCentreBattle = async () => {
        fireEvent.click(screen.getByRole('button', { name: actionName(centre.id) }));
        return screen.findByTestId(`game-${centre.challengeType}`, {}, LAZY_TIMEOUT);
    };

    it(
        'ends the battle from the dark backdrop',
        async () => {
            const { container } = render(<App />);
            await startCentreBattle();
            fireEvent.click(container.querySelector('[style*="min-width: 100vw"]'));
            expect(screen.queryByTestId(`game-${centre.challengeType}`)).toBeNull();
        },
        TEST_TIMEOUT,
    );

    it(
        'ends the battle when the card backdrop is clicked',
        async () => {
            render(<App />);
            await startCentreBattle();
            fireEvent.click(document.querySelector('.fixed.inset-0.z-50.flex'));
            expect(screen.queryByTestId(`game-${centre.challengeType}`)).toBeNull();
        },
        TEST_TIMEOUT,
    );

    it(
        'shows "YOU DIED" after ten wrong answers, then "LEVEL RESTORED" on the next win',
        async () => {
            localStorage.setItem(skillsKey(1), JSON.stringify({ skills: { [centre.id]: { level: 5, mobHealth: 1 } } }));
            render(<App />);
            await startCentreBattle();
            for (let i = 0; i < 10; i += 1) fireEvent.click(screen.getByText('wrong answer'));
            expect(screen.getByText('YOU DIED')).toBeInTheDocument();
            await waitFor(() => expect(screen.queryByText('YOU DIED')).toBeNull(), { timeout: 4000 });

            await startCentreBattle();
            fireEvent.click(screen.getByText('right answer'));
            expect(await screen.findByText('LEVEL RESTORED!')).toBeInTheDocument();
        },
        TEST_TIMEOUT,
    );

    it(
        'says so when the mic button is used without speech recognition',
        async () => {
            vi.stubGlobal('webkitSpeechRecognition', undefined);
            render(<App />);
            await startCentreBattle();
            fireEvent.click(screen.getByText('mic'));
            expect(screen.getByText('games.micUnavailable')).toBeInTheDocument();
        },
        TEST_TIMEOUT,
    );

    it(
        'gives a bonus level and shows the loot when the bonus creature is caught in battle',
        async () => {
            vi.spyOn(Math, 'random').mockReturnValue(0);
            render(<App />);
            await startCentreBattle();
            fireEvent.click(await screen.findByAltText('Bonus creature', {}, LAZY_TIMEOUT));
            expect(await screen.findByText('LEVEL 2 REACHED!')).toBeInTheDocument();
            expect(savedGame().stats.phantomsCaught).toBe(1);
            // The creature leaves 200 ms after the catch and plans its next visit.
            await waitFor(() => expect(screen.queryByAltText('Bonus creature')).toBeNull());
        },
        TEST_TIMEOUT,
    );
});
