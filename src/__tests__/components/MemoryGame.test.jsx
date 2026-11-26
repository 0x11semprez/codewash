import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { THEME_CONFIG, DIFFICULTY_CONTENT } from '../../constants/gameData';
import MemoryGame from '../../components/skills/games/MemoryGame';

vi.stubGlobal(
    'Audio',
    class {
        play() {
            return Promise.resolve();
        }
        pause() {}
        addEventListener() {}
    },
);

const pairs = DIFFICULTY_CONTENT.memory[1].pairs;

const setup = () => {
    const onMathSubmit = vi.fn();
    const { container } = render(
        <MemoryGame isBattling difficulty={1} onMathSubmit={onMathSubmit} themeData={THEME_CONFIG.blocks} />,
    );
    const cards = [...container.querySelectorAll('div.cursor-pointer')];
    const groups = {};
    cards.forEach((card, index) => {
        const picture = card.querySelectorAll('img')[1].getAttribute('src');
        (groups[picture] = groups[picture] || []).push(index);
    });
    const click = (index) => fireEvent.click(cards[index]);
    const wait = (ms) => act(() => vi.advanceTimersByTime(ms));
    return { onMathSubmit, cards, groups: Object.values(groups), click, wait };
};

const playMatchingPairs = ({ groups, click, wait }) => {
    groups.forEach(([first, second]) => {
        click(first);
        click(second);
        wait(300);
    });
    wait(500);
};

describe('MemoryGame result', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('deals two cards for each pair', () => {
        const { cards, groups } = setup();
        expect(cards).toHaveLength(pairs * 2);
        expect(groups).toHaveLength(pairs);
        groups.forEach((group) => expect(group).toHaveLength(2));
    });

    it('reports a perfect game when no pair was missed', () => {
        const game = setup();
        playMatchingPairs(game);
        expect(game.onMathSubmit).toHaveBeenCalledTimes(1);
        expect(game.onMathSubmit).toHaveBeenCalledWith('WIN', { perfect: true });
    });

    it('does not report a perfect game after one mismatch', () => {
        const game = setup();
        game.click(game.groups[0][0]);
        game.click(game.groups[1][0]);
        game.wait(300);
        game.wait(500);
        playMatchingPairs(game);
        expect(game.onMathSubmit).toHaveBeenCalledTimes(1);
        expect(game.onMathSubmit).toHaveBeenCalledWith('WIN', { perfect: false });
    });

    it('does not report anything before every pair is found', () => {
        const game = setup();
        game.click(game.groups[0][0]);
        game.click(game.groups[0][1]);
        game.wait(300);
        game.wait(500);
        expect(game.onMathSubmit).not.toHaveBeenCalled();
    });
});
