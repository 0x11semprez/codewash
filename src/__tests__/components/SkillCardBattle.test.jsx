// Renders the real (not stubbed) mini-games inside SkillCard, so a missing import in the
// battle tree (e.g. GameErrorBoundary in PR #49) or in a game itself fails the suite.
// SkillCard.test.jsx covers the routing with stubbed games; this file covers the real ones.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SKILL_DATA, THEME_CONFIG } from '../../constants/gameData';
import SkillCard from '../../components/skills/SkillCard';

// Same shapes as generateChallenge in useBattle.js.
const CHALLENGES = {
    math: { type: 'math', question: '1 + 1', answer: '2' },
    patterns: { type: 'patterns', question: 'Simon Says!', answer: 'WIN' },
    reading: { type: 'reading', question: 'cat', answer: 'cat' },
    writing: { type: 'writing', question: 'Spell it!', answer: 'CAT', images: [], displayName: 'Cat' },
    memory: { type: 'memory', question: 'Find Pairs!', answer: 'WIN' },
};
const challengeFor = (type) => CHALLENGES[type] || { type: 'manual', question: 'Task Complete?', answer: 'yes' };

const renderBattle = (config) =>
    render(
        <SkillCard
            config={config}
            data={{ level: 1, xp: 0, mobHealth: 100, mobMaxHealth: 100 }}
            themeData={THEME_CONFIG.minecraft}
            isCenter
            isBattling
            mobName="Zombie"
            mobAura={null}
            challenge={challengeFor(config.challengeType)}
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

describe('SkillCard battle with real mini-games', () => {
    let consoleError;
    beforeEach(() => {
        consoleError = vi.spyOn(console, 'error');
    });
    afterEach(() => consoleError.mockRestore());

    it.each(SKILL_DATA.map((skill) => [skill.id, skill]))(
        'renders the real %s game without crashing',
        async (id, config) => {
            renderBattle(config);
            // The Suspense fallback is null: once the lazy game resolves, the battle panel has
            // the game plus the XP bar.
            await waitFor(() => expect(document.querySelector('.animate-in')?.children.length).toBeGreaterThan(1));
            expect(screen.queryByText('Game crashed!')).toBeNull();
            const gameErrors = consoleError.mock.calls.filter((args) => String(args[0]).includes('[GameError]'));
            expect(gameErrors).toEqual([]);
        },
    );
});
