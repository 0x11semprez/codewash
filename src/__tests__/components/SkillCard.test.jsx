import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { installFakeIntersectionObserver } from '../helpers/fakeIntersectionObserver';
import { SKILL_DATA, THEME_CONFIG } from '../../constants/gameData';

const stub = vi.hoisted(() => (name) => ({ default: () => <div data-testid={`game-${name}`} /> }));
vi.mock('../../components/skills/games/MemoryGame', () => stub('memory'));
vi.mock('../../components/skills/games/PatternGame', () => stub('patterns'));
vi.mock('../../components/skills/games/MathGame', () => stub('math'));
vi.mock('../../components/skills/games/WritingGame', () => stub('writing'));
vi.mock('../../components/skills/games/ReadingGame', () => stub('reading'));
vi.mock('../../components/skills/games/CleaningGame', () => stub('cleaning'));

import SkillCard from '../../components/skills/SkillCard';

const renderCard = (config, isBattling, selectedBorder = null) =>
    render(
        <SkillCard
            config={config}
            data={{ level: 1, xp: 0, mobHealth: 100, mobMaxHealth: 100 }}
            themeData={THEME_CONFIG.blocks}
            isCenter
            isBattling={isBattling}
            mobName="Zombie"
            mobAura={null}
            challenge={{ question: '1 + 1', answer: '2', images: [] }}
            isListening={false}
            spokenText=""
            damageNumbers={[]}
            onStartBattle={() => {}}
            onEndBattle={() => {}}
            onMathSubmit={() => {}}
            onMicClick={() => {}}
            difficulty={1}
            setDifficulty={() => {}}
            unlockedDifficulty={1}
            selectedBorder={selectedBorder}
            borderColor={null}
            bossHealing={false}
        />,
    );

describe('SkillCard mini-game routing', () => {
    it.each(SKILL_DATA.map((skill) => [skill.id, skill]))('renders the %s game while battling', async (id, config) => {
        renderCard(config, true);
        expect(await screen.findByTestId(`game-${id}`)).toBeInTheDocument();
        expect(screen.getAllByTestId(/^game-/)).toHaveLength(1);
    });

    it.each(SKILL_DATA.map((skill) => [skill.id, skill]))(
        'does not render the %s game outside of a battle',
        (id, config) => {
            renderCard(config, false);
            expect(screen.queryByTestId(`game-${id}`)).toBeNull();
        },
    );
});

describe('SkillCard animation pause', () => {
    it('observes the card that carries the border effect and pauses it offscreen', () => {
        const io = installFakeIntersectionObserver();
        const { container, unmount } = renderCard(SKILL_DATA[0], false, 'fire');
        const card = container.querySelector('.border-effect-fire');
        expect(io.instances[0].observed.has(card)).toBe(true);
        act(() => io.trigger(card, false));
        expect(card).toHaveAttribute('data-offscreen');
        unmount();
        vi.unstubAllGlobals();
    });

    it('observes the portalled card again when a battle starts', () => {
        const io = installFakeIntersectionObserver();
        const { rerender, unmount } = renderCard(SKILL_DATA[1], false, 'fire');
        const before = document.querySelector('.border-effect-fire');
        rerender(
            <SkillCard
                config={SKILL_DATA[1]}
                data={{ level: 1, xp: 0, mobHealth: 100, mobMaxHealth: 100 }}
                themeData={THEME_CONFIG.blocks}
                isCenter
                isBattling
                mobName="Zombie"
                mobAura={null}
                challenge={{ question: '1 + 1', answer: '2', images: [] }}
                isListening={false}
                spokenText=""
                damageNumbers={[]}
                onStartBattle={() => {}}
                onEndBattle={() => {}}
                onMathSubmit={() => {}}
                onMicClick={() => {}}
                difficulty={1}
                setDifficulty={() => {}}
                unlockedDifficulty={1}
                selectedBorder="fire"
                borderColor={null}
                bossHealing={false}
            />,
        );
        const after = document.querySelector('.border-effect-fire');
        expect(after).not.toBe(before);
        expect(io.instances.some((observer) => observer.observed.has(after))).toBe(true);
        expect(io.instances.some((observer) => observer.observed.has(before))).toBe(false);
        unmount();
        vi.unstubAllGlobals();
    });
});
