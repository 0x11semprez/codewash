import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMemoryStorage } from '../helpers/memoryStorage';
import I18nProvider from '../../i18n/I18nProvider';
import { SKILL_DATA, THEME_CONFIG, buildTheme } from '../../constants/gameData';
import { getDefaultStats } from '../../utils/achievementUtils';
import SkillCard from '../../components/skills/SkillCard';
import MenuDrawer from '../../components/drawers/MenuDrawer';
import CosmeticsDrawer from '../../components/drawers/CosmeticsDrawer';
import AchievementToast from '../../components/ui/AchievementToast';
import ReadingGame from '../../components/skills/games/ReadingGame';
import PatternGame from '../../components/skills/games/PatternGame';
import PhantomEvent from '../../components/PhantomEvent';

vi.mock('../../services/soundManager', () => ({
    playClick: vi.fn(),
    playSuccessfulHit: vi.fn(),
    getSfxVolume: () => 0,
}));

const inFrench = (ui) => render(<I18nProvider initialLanguage="fr">{ui}</I18nProvider>);

const skills = Object.fromEntries(SKILL_DATA.map((s) => [s.id, { level: 21, xp: 0, difficulty: 1 }]));

const cardProps = {
    data: { level: 3, xp: 0, mobHealth: 100, mobMaxHealth: 100 },
    isCenter: true,
    mobName: 'Zombie',
    challenge: { question: '1 + 1', answer: '2', images: [] },
    isListening: false,
    spokenText: '',
    damageNumbers: [],
    onStartBattle: () => {},
    onEndBattle: () => {},
    onMathSubmit: () => {},
    onMicClick: () => {},
    difficulty: 1,
    setDifficulty: () => {},
    unlockedDifficulty: 2,
    selectedBorder: null,
    borderColor: null,
    bossHealing: false,
};

describe('screens in French', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', createMemoryStorage());
    });
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('translates the skill card, including the theme skill name', () => {
        const reading = SKILL_DATA.find((s) => s.id === 'reading');
        inFrench(<SkillCard {...cardProps} config={reading} themeData={THEME_CONFIG.spy} isBattling={false} />);
        expect(screen.getByText('Analyse de renseignements')).toBeInTheDocument();
        expect(screen.getByText('Dossiers secrets')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Décoder !' })).toBeInTheDocument();
        expect(screen.getByText('Niv. 3')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Augmenter la difficulté' })).toBeInTheDocument();
    });

    it('uses the dictionary for a theme without its own text or translation', () => {
        const math = SKILL_DATA.find((s) => s.id === 'math');
        const custom = buildTheme('custom', {
            name: 'Custom',
            background: 'b.webp',
            logo: 'l.webp',
            cardBack: 'c.webp',
        });
        inFrench(<SkillCard {...cardProps} config={math} themeData={custom} isBattling={false} />);
        expect(screen.getByText('Maths')).toBeInTheDocument();
        expect(screen.getByText('Circuits magiques')).toBeInTheDocument();
    });

    it('uses the theme text when the theme has no translation for the language', () => {
        const math = SKILL_DATA.find((s) => s.id === 'math');
        const custom = buildTheme('custom', {
            name: 'Custom',
            background: 'b.webp',
            logo: 'l.webp',
            cardBack: 'c.webp',
            skills: { math: { name: 'Counting', title: 'Abacus' } },
        });
        inFrench(<SkillCard {...cardProps} config={math} themeData={custom} isBattling={false} />);
        expect(screen.getByText('Counting')).toBeInTheDocument();
        expect(screen.getByText('Abacus')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Calculer !' })).toBeInTheDocument();
    });

    it('puts the aura adjective after the mob name in French', () => {
        const math = SKILL_DATA.find((s) => s.id === 'math');
        inFrench(<SkillCard {...cardProps} config={math} themeData={THEME_CONFIG.blocks} isBattling mobAura="frost" />);
        expect(screen.getByText('Zombie gelé')).toBeInTheDocument();
        expect(screen.getByText('Quête')).toBeInTheDocument();
    });

    it('translates achievements, tiers and badges in the menu drawer', () => {
        const stats = { ...getDefaultStats(), phantomsCaught: 6 };
        inFrench(<MenuDrawer isOpen skills={skills} stats={stats} />);
        expect(screen.getByText('Succès spéciaux')).toBeInTheDocument();
        expect(screen.getByText('Chasseur de fantômes de bronze')).toBeInTheDocument();
        expect(screen.getByText('Premiers pas')).toBeInTheDocument();
        expect(screen.getByText('LECTURE')).toBeInTheDocument();
        expect(screen.getAllByText('Bois (Niv. 20)').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Suivant : Argent').length).toBeGreaterThan(0);
    });

    it('translates border effects and badge hints in the cosmetics drawer', () => {
        inFrench(
            <CosmeticsDrawer
                isOpen
                activeTheme="blocks"
                setActiveTheme={() => {}}
                selectedBorder="solid"
                setSelectedBorder={() => {}}
                borderColor="#FFD700"
                setBorderColor={() => {}}
                unlockedBorders={[]}
                unlockedAchievements={['speed_demon']}
            />,
        );
        expect(screen.getByText('Thèmes et cosmétiques')).toBeInTheDocument();
        expect(screen.getByText('Badge Pierre requis')).toBeInTheDocument();
        expect(screen.getByText('Fil sous tension')).toBeInTheDocument();
        expect(screen.getByText('Démon de vitesse')).toBeInTheDocument();
        expect(screen.getByText('ACTIF')).toBeInTheDocument();
        // Theme names come from the "translations" block of each theme.
        expect(screen.getByText('Blocs')).toBeInTheDocument();
        expect(screen.getByText('Espace')).toBeInTheDocument();
        expect(screen.getByText('Portail des ombres')).toBeInTheDocument();
    });

    it('translates the achievement toast with its tier', () => {
        inFrench(<AchievementToast achievementId="combined_levels" tierIndex={1} />);
        expect(screen.getByText('SUCCÈS DÉBLOQUÉ !')).toBeInTheDocument();
        expect(screen.getByText("Puissance d'argent")).toBeInTheDocument();
        expect(screen.getByText('Rang Argent')).toBeInTheDocument();
    });

    it('translates the microphone status of the reading game', () => {
        const { rerender } = inFrench(
            <ReadingGame challenge={{ question: 'CAT', answer: 'CAT' }} isListening={false} spokenText="" />,
        );
        expect(screen.getByText('Micro coupé')).toBeInTheDocument();
        expect(screen.getByText('Appuie pour parler')).toBeInTheDocument();
        rerender(
            <I18nProvider initialLanguage="fr">
                <ReadingGame challenge={{ question: 'CAT', answer: 'CAT' }} isListening spokenText="games.listening" />
            </I18nProvider>,
        );
        expect(screen.getByText('Écoute...')).toBeInTheDocument();
        rerender(
            <I18nProvider initialLanguage="fr">
                <ReadingGame challenge={{ question: 'CAT', answer: 'CAT' }} isListening spokenText="DOG" />
            </I18nProvider>,
        );
        expect(screen.getByText('DOG')).toBeInTheDocument();
    });

    it('translates the pattern game round and axolotl colours', () => {
        inFrench(
            <PatternGame isBattling={false} difficulty={1} onMathSubmit={() => {}} themeData={THEME_CONFIG.blocks} />,
        );
        expect(screen.getByText(/Manche : 0/)).toBeInTheDocument();
        expect(screen.getByText('Rose')).toBeInTheDocument();
    });

    it('translates the pattern pieces of a theme', () => {
        inFrench(
            <PatternGame isBattling={false} difficulty={7} onMathSubmit={() => {}} themeData={THEME_CONFIG.space} />,
        );
        expect(screen.getByText('Argent')).toBeInTheDocument();
        expect(screen.getByAltText('Jaune')).toBeInTheDocument();
    });

    it('translates the phantom bonus', () => {
        vi.useFakeTimers();
        vi.spyOn(Math, 'random').mockReturnValue(0);
        inFrench(<PhantomEvent battlingSkillId={null} onAwardLevel={() => {}} />);
        React.act(() => vi.advanceTimersByTime(10 * 60 * 1000));
        fireEvent.click(screen.getByAltText('Créature bonus'));
        expect(screen.getByText('+1 niveau !')).toBeInTheDocument();
        vi.useRealTimers();
    });
});
