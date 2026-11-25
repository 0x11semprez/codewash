import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SKILL_DATA, THEME_CONFIG } from '../../constants/gameData';

const stub = vi.hoisted(() => (name) => ({ default: () => <div data-testid={`game-${name}`} /> }));
vi.mock('../../components/skills/games/MemoryGame', () => stub('memory'));
vi.mock('../../components/skills/games/PatternGame', () => stub('patterns'));
vi.mock('../../components/skills/games/MathGame', () => stub('math'));
vi.mock('../../components/skills/games/WritingGame', () => stub('writing'));
vi.mock('../../components/skills/games/ReadingGame', () => stub('reading'));
vi.mock('../../components/skills/games/CleaningGame', () => stub('cleaning'));

import SkillCard from '../../components/skills/SkillCard';

const renderCard = (config, isBattling) =>
    render(
        <SkillCard
            config={config}
            data={{ level: 1, xp: 0, mobHealth: 100, mobMaxHealth: 100 }}
            themeData={THEME_CONFIG.minecraft}
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
            selectedBorder={null}
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
