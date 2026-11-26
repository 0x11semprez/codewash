// Behavior of each mini-game on its own: what the child sees and what the game reports back.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MathGame from '../../components/skills/games/MathGame';
import WritingGame from '../../components/skills/games/WritingGame';
import ReadingGame from '../../components/skills/games/ReadingGame';
import CleaningGame from '../../components/skills/games/CleaningGame';
import MemoryGame from '../../components/skills/games/MemoryGame';
import PatternGame from '../../components/skills/games/PatternGame';
import { DIFFICULTY_CONTENT, THEME_CONFIG } from '../../constants/gameData';

vi.mock('../../services/soundManager', () => ({
    playClick: vi.fn(),
    playMatch: vi.fn(),
    playMismatch: vi.fn(),
    playNote: vi.fn(),
}));

const theme = THEME_CONFIG.blocks;

// Replaces one difficulty entry for the length of a test.
const withDifficultyEntry = (table, level, entry) => {
    const original = DIFFICULTY_CONTENT[table][level];
    DIFFICULTY_CONTENT[table][level] = entry;
    return () => {
        DIFFICULTY_CONTENT[table][level] = original;
    };
};

describe('MathGame', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('submits the right answer as soon as it is typed', () => {
        const onSubmit = vi.fn();
        render(<MathGame challenge={{ question: '6 + 6 = ?', answer: '12' }} onMathSubmit={onSubmit} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: '1' } });
        expect(onSubmit).not.toHaveBeenCalled();
        fireEvent.change(screen.getByRole('textbox'), { target: { value: '12' } });
        expect(onSubmit).toHaveBeenCalledWith('12');
    });

    it('reports a wrong answer, then clears the input and focuses it again', () => {
        const onSubmit = vi.fn();
        render(<MathGame challenge={{ question: '6 + 6 = ?', answer: '12' }} onMathSubmit={onSubmit} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: '1a3' } });
        expect(onSubmit).toHaveBeenCalledWith('WRONG');
        expect(input).toBeDisabled();
        act(() => vi.advanceTimersByTime(510));
        expect(input).not.toBeDisabled();
        expect(input).toHaveValue('');
        expect(document.activeElement).toBe(input);
    });

    it('does not crash before a challenge is ready', () => {
        const onSubmit = vi.fn();
        render(<MathGame challenge={null} onMathSubmit={onSubmit} />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(onSubmit).not.toHaveBeenCalled();
    });
});

describe('WritingGame', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('accepts the word in any case and without its spaces', () => {
        const onSubmit = vi.fn();
        render(<WritingGame challenge={{ answer: 'I LOVE MOM' }} onMathSubmit={onSubmit} />);
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'i love mom' } });
        expect(onSubmit).toHaveBeenCalledWith('ILOVEMOM');
    });

    it('shakes on a wrong word of full length, then lets the child try again', () => {
        const onSubmit = vi.fn();
        render(<WritingGame challenge={{ answer: 'CAT' }} onMathSubmit={onSubmit} />);
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: 'ca' } });
        expect(input).toHaveValue('CA');
        fireEvent.change(input, { target: { value: 'cot' } });
        expect(onSubmit).not.toHaveBeenCalled();
        expect(input).toBeDisabled();
        act(() => vi.advanceTimersByTime(510));
        expect(input).toHaveValue('');
        expect(document.activeElement).toBe(input);
    });

    it('keeps a wide gap for the space of a short phrase', () => {
        const { container } = render(<WritingGame challenge={{ answer: 'HI MOM' }} onMathSubmit={vi.fn()} />);
        expect(container.querySelectorAll('.w-10')).toHaveLength(6);
    });

    it('uses smaller letter slots for long words', () => {
        const { container } = render(<WritingGame challenge={{ answer: 'ELEPHANTS' }} onMathSubmit={vi.fn()} />);
        expect(container.querySelectorAll('.w-7')).toHaveLength(9);
    });
});

describe('ReadingGame', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    const renderReading = (props = {}) =>
        render(
            <ReadingGame
                challenge={{ question: 'SEE', answer: 'SEE' }}
                isListening={false}
                spokenText=""
                onMicClick={vi.fn()}
                onMathSubmit={vi.fn()}
                {...props}
            />,
        );

    it('shows the word and the mic state', () => {
        renderReading();
        expect(screen.getByText('SEE')).toBeInTheDocument();
        expect(screen.getByText('Mic Off')).toBeInTheDocument();
        expect(screen.getByText('Tap to Speak')).toBeInTheDocument();
    });

    it('shows "Listening..." while the mic is on', () => {
        renderReading({ isListening: true });
        expect(screen.getByText('Listening...')).toBeInTheDocument();
        expect(screen.queryByText('Tap to Speak')).toBeNull();
    });

    it('translates the status messages of the voice recognition', () => {
        renderReading({ spokenText: 'Mic permission denied' });
        expect(screen.getByText('Mic permission denied')).toBeInTheDocument();
    });

    it('flashes red for a wrong word, but not for a homophone or a very short sound', () => {
        const { rerender, container } = renderReading({ spokenText: 'SEA' });
        const box = () => container.firstChild;
        expect(box().className).not.toContain('animate-shake');

        const props = {
            challenge: { question: 'SEE', answer: 'SEE' },
            isListening: true,
            onMicClick: vi.fn(),
            onMathSubmit: vi.fn(),
        };
        rerender(<ReadingGame {...props} spokenText="X" />);
        expect(box().className).not.toContain('animate-shake');

        rerender(<ReadingGame {...props} spokenText="TREE" />);
        expect(box().className).toContain('animate-shake');
        expect(screen.getByText('TREE')).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(500));
        expect(box().className).not.toContain('animate-shake');
    });

    it('ignores spoken text when there is no word to compare', () => {
        const { container } = renderReading({ challenge: null, spokenText: 'TREE' });
        expect(container.firstChild.className).not.toContain('animate-shake');
    });

    it('checks a word with no homophones only against the word itself', () => {
        const { container } = renderReading({ challenge: { question: 'CAT', answer: 'CAT' }, spokenText: 'CAT' });
        expect(container.firstChild.className).not.toContain('animate-shake');
    });

    it('lets an adult skip the word, and passes mic clicks up', () => {
        const onSubmit = vi.fn();
        const onMic = vi.fn();
        renderReading({ onMathSubmit: onSubmit, onMicClick: onMic });
        fireEvent.click(screen.getByText('Tap to Speak'));
        expect(onMic).toHaveBeenCalledOnce();
        fireEvent.click(screen.getByText('Skip / Manual Success'));
        expect(onSubmit).toHaveBeenCalledWith('SEE');
    });
});

describe('CleaningGame', () => {
    it('asks a parent before marking the task complete', () => {
        const onSubmit = vi.fn();
        render(<CleaningGame challenge={{ question: 'Write: Tidy up', answer: 'yes' }} onMathSubmit={onSubmit} />);
        expect(screen.getByText('Tidy up')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Complete!'));
        expect(screen.getByText('What is this?')).toBeInTheDocument();
        fireEvent.change(screen.getAllByRole('textbox').at(-1), { target: { value: 'floppy disk' } });
        fireEvent.click(screen.getByText('Submit'));

        expect(onSubmit).toHaveBeenCalledWith('yes');
        expect(screen.queryByText('What is this?')).toBeNull();
    });

    it('closes the parent check without completing the task', () => {
        const onSubmit = vi.fn();
        render(<CleaningGame challenge={{ question: 'Tidy up', answer: 'yes' }} onMathSubmit={onSubmit} />);
        fireEvent.click(screen.getByText('Complete!'));
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(screen.queryByText('What is this?')).toBeNull();
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('shows an empty task before a challenge is ready', () => {
        render(<CleaningGame challenge={null} onMathSubmit={vi.fn()} />);
        expect(screen.getByText('Complete!')).toBeInTheDocument();
    });
});

describe('Parental check', () => {
    it('fills one slot per letter, shows an error for a wrong answer and clears it on typing', () => {
        const onSubmit = vi.fn();
        render(<CleaningGame challenge={{ question: 'Tidy up', answer: 'yes' }} onMathSubmit={onSubmit} />);
        fireEvent.click(screen.getByText('Complete!'));
        const input = screen.getAllByRole('textbox').at(-1);
        const slots = () => [...document.querySelectorAll('.w-7')];

        fireEvent.change(input, { target: { value: 'flo' } });
        expect(slots().filter((slot) => slot.textContent === '*')).toHaveLength(3);
        expect(slots()[0].className).toContain('border-green-500');
        expect(slots()[3].className).toContain('border-gray-600');

        fireEvent.click(screen.getByText('Submit'));
        expect(screen.getByText('Incorrect answer. Try again!')).toBeInTheDocument();
        expect(slots()[0].className).toContain('border-red-500');
        expect(onSubmit).not.toHaveBeenCalled();

        fireEvent.change(input, { target: { value: 'flop' } });
        expect(screen.queryByText('Incorrect answer. Try again!')).toBeNull();
    });

    it('refuses input longer than the answer and focuses the input when a slot is clicked', () => {
        render(<CleaningGame challenge={{ question: 'Tidy up', answer: 'yes' }} onMathSubmit={vi.fn()} />);
        fireEvent.click(screen.getByText('Complete!'));
        const input = screen.getAllByRole('textbox').at(-1);
        fireEvent.change(input, { target: { value: 'FLOPPYDISK' } });
        fireEvent.change(input, { target: { value: 'FLOPPYDISKS' } });
        expect(input).toHaveValue('FLOPPYDISK');
        input.blur();
        fireEvent.click(document.querySelector('.w-7'));
        expect(document.activeElement).toBe(input);
    });

    it('closes when the backdrop is clicked', () => {
        render(<CleaningGame challenge={{ question: 'Tidy up', answer: 'yes' }} onMathSubmit={vi.fn()} />);
        fireEvent.click(screen.getByText('Complete!'));
        fireEvent.click(document.querySelector('.backdrop-blur-sm'));
        expect(screen.queryByText('What is this?')).toBeNull();
    });
});

describe('MemoryGame', () => {
    let random;
    beforeEach(() => {
        vi.useFakeTimers();
        // No shuffling: the deck is [A, B, C, A, B, C] for 3 pairs.
        random = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });
    afterEach(() => {
        random.mockRestore();
        vi.useRealTimers();
    });

    const cards = (container) => [...container.querySelectorAll('.cursor-pointer')];

    it('finds every pair and reports the win', () => {
        const onSubmit = vi.fn();
        const { container } = render(
            <MemoryGame isBattling difficulty={1} onMathSubmit={onSubmit} themeData={theme} />,
        );
        expect(cards(container)).toHaveLength(6);

        for (let pair = 0; pair < 3; pair += 1) {
            const [first] = cards(container);
            fireEvent.click(first);
            fireEvent.click(first);
            // The matching card is three places further in the unshuffled deck, minus the pairs already gone.
            fireEvent.click(cards(container)[3 - pair]);
            act(() => vi.advanceTimersByTime(300));
        }
        expect(cards(container)).toHaveLength(0);
        act(() => vi.advanceTimersByTime(500));
        expect(onSubmit).toHaveBeenCalledWith('WIN');
    });

    it('turns two different cards back after a short shake, and ignores clicks meanwhile', () => {
        const { container } = render(<MemoryGame isBattling difficulty={1} onMathSubmit={vi.fn()} themeData={theme} />);
        const [a, b, c] = cards(container);
        fireEvent.click(a);
        fireEvent.click(b);
        fireEvent.click(c);
        expect(c.className).not.toContain('rotate-y-180');
        act(() => vi.advanceTimersByTime(300));
        expect(a.className).toContain('animate-shake-flipped');
        act(() => vi.advanceTimersByTime(500));
        expect(a.className).not.toContain('rotate-y-180');
    });

    it('clears the board when the battle ends', () => {
        const { container, rerender } = render(
            <MemoryGame isBattling difficulty={1} onMathSubmit={vi.fn()} themeData={theme} />,
        );
        rerender(<MemoryGame isBattling={false} difficulty={1} onMathSubmit={vi.fn()} themeData={theme} />);
        expect(cards(container)).toHaveLength(0);
    });

    it('uses the first difficulty for an unknown level and safe defaults for a partial one', () => {
        const { container, unmount } = render(
            <MemoryGame isBattling difficulty={99} onMathSubmit={vi.fn()} themeData={theme} />,
        );
        expect(cards(container)).toHaveLength(6);
        unmount();

        const restore = withDifficultyEntry('memory', 1, {});
        try {
            const view = render(<MemoryGame isBattling difficulty={1} onMathSubmit={vi.fn()} themeData={theme} />);
            expect(cards(view.container)).toHaveLength(6);
            expect(view.container.firstChild.style.gridTemplateColumns).toBe('repeat(4, 1fr)');
        } finally {
            restore();
        }
    });
});

describe('PatternGame', () => {
    let random;
    beforeEach(() => {
        vi.useFakeTimers();
        // Always the first piece, so the sequence is known.
        random = vi.spyOn(Math, 'random').mockReturnValue(0);
    });
    afterEach(() => {
        random.mockRestore();
        vi.useRealTimers();
    });

    const firstPiece = Object.keys(theme.patternPieces)[0];
    const secondPiece = Object.keys(theme.patternPieces)[1];
    const piece = (name) => screen.getAllByText(name)[0].closest('.cursor-pointer');
    const watchSequence = () => act(() => vi.advanceTimersByTime(5000));

    it('plays the sequence, then counts a round for every right copy', () => {
        const onSubmit = vi.fn();
        render(<PatternGame isBattling difficulty={1} onMathSubmit={onSubmit} themeData={theme} />);
        expect(screen.getByText('Watch!')).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(500));
        expect(piece(firstPiece).className).toContain('ring-yellow-400');
        fireEvent.click(piece(firstPiece));
        watchSequence();
        expect(piece(firstPiece).className).not.toContain('ring-yellow-400');
        expect(screen.getByText('Your turn!')).toBeInTheDocument();

        fireEvent.click(piece(firstPiece));
        act(() => vi.advanceTimersByTime(300));
        expect(onSubmit).toHaveBeenCalledWith('WIN', 2);
        expect(screen.getByText(/Round: 1/)).toBeInTheDocument();

        // Second round: the sequence is now two pieces long.
        watchSequence();
        fireEvent.click(piece(firstPiece));
        expect(onSubmit).toHaveBeenCalledOnce();
        fireEvent.click(piece(firstPiece));
        act(() => vi.advanceTimersByTime(300));
        expect(onSubmit).toHaveBeenLastCalledWith('WIN', 3);
    });

    it('ends the game on a wrong piece and offers a retry', () => {
        render(<PatternGame isBattling difficulty={1} onMathSubmit={vi.fn()} themeData={theme} />);
        watchSequence();
        fireEvent.click(piece(firstPiece));
        act(() => vi.advanceTimersByTime(300));
        watchSequence();
        fireEvent.click(piece(secondPiece));
        expect(screen.getByText('Game Over! Rounds: 1')).toBeInTheDocument();
        fireEvent.click(piece(firstPiece));
        expect(screen.getByText('Game Over! Rounds: 1')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Retry'));
        expect(screen.getByText('Watch!')).toBeInTheDocument();
        expect(screen.getByText(/Round: 0/)).toBeInTheDocument();
    });

    it('builds a new sequence every round on the hardest level', () => {
        const onSubmit = vi.fn();
        render(<PatternGame isBattling difficulty={7} onMathSubmit={onSubmit} themeData={theme} />);
        watchSequence();
        fireEvent.click(piece(firstPiece));
        act(() => vi.advanceTimersByTime(300));
        watchSequence();
        fireEvent.click(piece(firstPiece));
        fireEvent.click(piece(firstPiece));
        act(() => vi.advanceTimersByTime(300));
        expect(onSubmit).toHaveBeenCalledTimes(2);
    });

    it('resets when the battle ends', () => {
        const { rerender } = render(<PatternGame isBattling difficulty={1} onMathSubmit={vi.fn()} themeData={theme} />);
        rerender(<PatternGame isBattling={false} difficulty={1} onMathSubmit={vi.fn()} themeData={theme} />);
        expect(screen.queryByText('Watch!')).toBeNull();
        expect(screen.queryByText('Your turn!')).toBeNull();
    });

    it('uses two pieces for an unknown level or a level without a piece count', () => {
        const { container, unmount } = render(
            <PatternGame isBattling difficulty={99} onMathSubmit={vi.fn()} themeData={theme} />,
        );
        expect(container.querySelectorAll('.cursor-pointer')).toHaveLength(2);
        unmount();

        const restore = withDifficultyEntry('patterns', 1, {});
        try {
            const view = render(<PatternGame isBattling difficulty={1} onMathSubmit={vi.fn()} themeData={theme} />);
            expect(view.container.querySelectorAll('.cursor-pointer')).toHaveLength(2);
        } finally {
            restore();
        }
    });
});
