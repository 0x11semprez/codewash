// What a skill card shows around the mini-game: level colors, borders, enemy, HP, damage and difficulty.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SKILL_DATA, THEME_CONFIG, DIFFICULTY_IMAGES } from '../../constants/gameData';

const stub = vi.hoisted(() => (name) => ({ default: () => <div data-testid={`game-${name}`} /> }));
vi.mock('../../components/skills/games/MemoryGame', () => stub('memory'));
vi.mock('../../components/skills/games/PatternGame', () => stub('patterns'));
vi.mock('../../components/skills/games/MathGame', () => stub('math'));
vi.mock('../../components/skills/games/WritingGame', () => stub('writing'));
vi.mock('../../components/skills/games/ReadingGame', () => stub('reading'));
vi.mock('../../components/skills/games/CleaningGame', () => stub('cleaning'));

import SkillCard from '../../components/skills/SkillCard';

const skill = (id) => SKILL_DATA.find((entry) => entry.id === id);
const theme = THEME_CONFIG.blocks;

const baseProps = (overrides = {}) => ({
    config: skill('math'),
    data: { level: 1, xp: 0, mobHealth: 100, mobMaxHealth: 100 },
    themeData: theme,
    isCenter: true,
    isBattling: false,
    mobName: 'Zombie',
    mobAura: null,
    challenge: { question: '1 + 1 = ?', answer: '2', images: [] },
    isListening: false,
    spokenText: '',
    damageNumbers: [],
    onStartBattle: vi.fn(),
    onEndBattle: vi.fn(),
    onMathSubmit: vi.fn(),
    onMicClick: vi.fn(),
    difficulty: 1,
    setDifficulty: vi.fn(),
    unlockedDifficulty: 1,
    selectedBorder: null,
    borderColor: null,
    bossHealing: false,
    ...overrides,
});

const renderCard = (overrides) => {
    const props = baseProps(overrides);
    return { ...render(<SkillCard {...props} />), props };
};

// The outer card element: the one with the fixed card size.
const card = () => document.querySelector('.w-\\[300px\\]');

afterEach(() => {
    vi.useRealTimers();
});

describe('SkillCard level look', () => {
    it.each([
        [1, 'border-stone-500', 'text-white'],
        [20, 'border-wood', 'text-amber-700'],
        [40, 'border-stone', 'text-stone-400'],
        [60, 'border-gold', 'text-yellow-400'],
        [80, 'border-iron', 'text-gray-200'],
        [100, 'border-emerald', 'text-emerald-400'],
        [120, 'border-diamond', 'text-cyan-300'],
        [140, 'border-titanium', 'text-gray-500'],
        [160, 'border-titanium', 'text-rainbow'],
    ])('uses the level %i border and text color', (level, border, text) => {
        renderCard({ data: { level, xp: 0, mobHealth: 100, mobMaxHealth: 100 } });
        expect(card().className).toContain(border);
        expect(screen.getByText(`Lvl ${level}`).className).toContain(text);
    });

    it('shows the prestige gem only on the center card from level 20', () => {
        const { unmount } = renderCard({ data: { level: 20, xp: 0 } });
        expect(document.querySelector('.gem-socket')).not.toBeNull();
        unmount();
        renderCard({ data: { level: 20, xp: 0 }, isCenter: false });
        expect(document.querySelector('.gem-socket')).toBeNull();
        expect(card().className).toContain('border-stone-700');
    });
});

describe('SkillCard border effects', () => {
    it('glows gold with the default border', () => {
        renderCard({ selectedBorder: 'solid', borderColor: '#123456' });
        expect(card().style.borderColor).toBe('rgb(255, 215, 0)');
    });

    it('uses the chosen color with the color picker border, or gold without one', () => {
        const { unmount } = renderCard({ selectedBorder: 'solid-picker', borderColor: '#123456' });
        expect(card().style.borderColor).toBe('rgb(18, 52, 86)');
        unmount();
        renderCard({ selectedBorder: 'solid-picker', borderColor: null });
        expect(card().style.borderColor).toBe('rgb(255, 215, 0)');
    });

    it('passes the color to the animated gradient and sparkle borders', () => {
        const { unmount } = renderCard({ selectedBorder: 'gradient', borderColor: '#123456' });
        expect(card().className).toContain('border-effect-gradient');
        expect(card().style.getPropertyValue('--border-color')).toBe('#123456');
        unmount();
        renderCard({ selectedBorder: 'sparkle', borderColor: null });
        expect(card().style.getPropertyValue('--border-color')).toBe('#FFD700');
    });

    it('uses only the effect class for other borders', () => {
        renderCard({ selectedBorder: 'electric', borderColor: '#123456' });
        expect(card().className).toContain('border-effect-electric');
        expect(card().className).not.toContain('border-stone-500');
        expect(card().style.getPropertyValue('--border-color')).toBe('');
    });
});

describe('SkillCard enemy and health', () => {
    it('shows the first enemy of the theme for a name the theme does not know', () => {
        renderCard({ mobName: 'Removed Mob' });
        const first = Object.keys(theme.enemies)[0];
        expect(screen.getByText(first)).toBeInTheDocument();
        expect(screen.getByAltText(first)).toHaveAttribute('src', theme.enemies[first]);
    });

    it('shows the theme memory icon, or the skill picture when the theme has none', () => {
        const { unmount } = renderCard({ config: skill('memory') });
        expect(document.querySelector(`img[src="${theme.skillIcons.memory}"]`)).not.toBeNull();
        unmount();
        renderCard({ config: skill('memory'), themeData: { ...theme, skillIcons: undefined } });
        expect(document.querySelector(`img[src="${skill('memory').img}"]`)).not.toBeNull();
    });

    it('adds the aura to the enemy name during a battle', () => {
        renderCard({ isBattling: true, mobAura: 'frost' });
        expect(screen.getByText('Frozen Zombie')).toBeInTheDocument();
    });

    it('keeps the plain name for an aura it does not know', () => {
        renderCard({ isBattling: true, mobAura: 'mystery' });
        expect(screen.getAllByText('Zombie').length).toBeGreaterThan(0);
    });

    it('shows full health when the save has no health yet', () => {
        renderCard({ data: { level: 1, xp: 0 } });
        expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('shows damage numbers and a knockback, then goes back to idle', () => {
        vi.useFakeTimers();
        const props = baseProps();
        const { rerender } = render(<SkillCard {...props} />);
        rerender(<SkillCard {...props} damageNumbers={[{ id: 1, val: 5, x: 0, y: 0 }]} />);
        expect(screen.getByText('-5')).toBeInTheDocument();
        expect(screen.getByAltText('Zombie').className).toContain('animate-knockback');
        act(() => vi.advanceTimersByTime(400));
        expect(screen.getByAltText('Zombie').className).toContain('animate-bob');
        rerender(<SkillCard {...props} damageNumbers={[]} />);
        expect(screen.queryByText('-5')).toBeNull();
    });

    it('shakes the boss while it heals', () => {
        renderCard({ bossHealing: true });
        expect(screen.getByAltText('Zombie').className).toContain('animate-shake');
        expect(screen.getByAltText('Zombie').className).toContain('hue-rotate-90');
    });
});

describe('SkillCard start button', () => {
    it('uses the colors of the skill gradient and starts the battle', () => {
        const { props } = renderCard();
        const button = screen.getByText(props.config.actionName);
        expect(button.style.background).toContain('linear-gradient');
        fireEvent.click(button);
        expect(props.onStartBattle).toHaveBeenCalledOnce();
    });

    it('falls back to purple when the skill has no gradient colors', () => {
        renderCard({ config: { ...skill('math'), colorStyle: { background: 'red' } } });
        expect(screen.getByText(skill('math').actionName).style.borderColor).toBe('rgb(168, 85, 247)');
    });
});

describe('SkillCard battle panel', () => {
    it('shows the math question without its "Write:" prefix', async () => {
        renderCard({ isBattling: true, challenge: { question: 'Write: 3 + 4 = ?', answer: '7' } });
        expect(await screen.findByTestId('game-math')).toBeInTheDocument();
        expect(screen.getByText('3 + 4 = ?')).toBeInTheDocument();
    });

    it('shows an empty question before the math challenge is ready', async () => {
        renderCard({ isBattling: true, challenge: null });
        expect(await screen.findByTestId('game-math')).toBeInTheDocument();
    });

    it('joins the pictures of a writing word with a plus sign', async () => {
        renderCard({
            config: skill('writing'),
            isBattling: true,
            challenge: { question: 'Spell it!', answer: 'AB', images: ['a.png', 'b.png'] },
        });
        expect(await screen.findByTestId('game-writing')).toBeInTheDocument();
        expect(screen.getByText('+')).toBeInTheDocument();
    });

    it('ends the battle from the backdrop, but not from a click on the card', async () => {
        const { props } = renderCard({ isBattling: true });
        await screen.findByTestId('game-math');
        fireEvent.click(screen.getByText('⚔ BATTLE ⚔'));
        expect(props.onEndBattle).not.toHaveBeenCalled();
        fireEvent.click(document.querySelector('.fixed.inset-0.z-50'));
        expect(props.onEndBattle).toHaveBeenCalledOnce();
    });

    it('hides the quest panel for memory and cleaning', async () => {
        renderCard({ config: skill('cleaning'), isBattling: true });
        await screen.findByTestId('game-cleaning');
        expect(screen.queryByText('⚔ BATTLE ⚔')).toBeNull();
    });

    it('hides the enemy and its health bar while a side card plays memory', async () => {
        renderCard({ config: skill('memory'), isBattling: true, isCenter: false, unlockedDifficulty: 3 });
        await screen.findByTestId('game-memory');
        expect(screen.queryByText('HP')).toBeNull();
        expect(screen.queryByRole('button', { name: 'Lower difficulty' })).toBeNull();
    });
});

describe('SkillCard difficulty controls', () => {
    it('moves the difficulty within the unlocked range', () => {
        const { props } = renderCard({ difficulty: 2, unlockedDifficulty: 3 });
        fireEvent.click(screen.getByRole('button', { name: 'Lower difficulty' }));
        fireEvent.click(screen.getByRole('button', { name: 'Raise difficulty' }));
        expect(props.setDifficulty.mock.calls).toEqual([[1], [3]]);
        expect(screen.getByAltText('Difficulty 2')).toHaveAttribute('src', DIFFICULTY_IMAGES[2]);
    });

    it('stays inside the limits and shows the first picture for an unknown level', () => {
        const { props, unmount } = renderCard({ difficulty: 1, unlockedDifficulty: 2 });
        fireEvent.click(screen.getByRole('button', { name: 'Lower difficulty' }));
        expect(props.setDifficulty).toHaveBeenLastCalledWith(1);
        unmount();
        const view = renderCard({ difficulty: 9, unlockedDifficulty: 2 });
        fireEvent.click(screen.getByRole('button', { name: 'Raise difficulty' }));
        expect(view.props.setDifficulty).toHaveBeenLastCalledWith(2);
        expect(screen.getByAltText('Difficulty 9')).toHaveAttribute('src', DIFFICULTY_IMAGES[1]);
    });

    it('has no difficulty for cleaning', () => {
        renderCard({ config: skill('cleaning'), unlockedDifficulty: 3 });
        expect(screen.queryByRole('button', { name: 'Lower difficulty' })).toBeNull();
    });
});
