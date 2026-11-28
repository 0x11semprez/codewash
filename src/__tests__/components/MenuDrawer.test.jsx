import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MenuDrawer from '../../components/drawers/MenuDrawer';
import { installFakeIntersectionObserver } from '../helpers/fakeIntersectionObserver';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key) => {
            const map = {
                'menu.title': 'Menu',
                'menu.totalLevel': 'Total Level',
                'menu.badges': 'Badges',
                'menu.achievements': 'Achievements',
                'menu.skills': 'Skills',
                'menu.locked': 'Locked',
                'menu.level': 'Level',
            };
            return map[key] || key;
        },
        language: 'en',
    }),
}));
vi.mock('../../i18n/gameText', () => ({
    achievementDescription: (t, a) => a.desc || '',
    achievementName: (_t, a) => a.name || 'Achievement',
    skillText: (t, lang, id) => id,
}));
vi.mock('../../services/soundManager', () => ({ playClick: vi.fn() }));

const makeSkills = (level = 5) => ({
    reading: { level, difficulty: 1, xp: 0 },
    math: { level, difficulty: 1, xp: 0 },
    writing: { level, difficulty: 1, xp: 0 },
    cleaning: { level, difficulty: 1, xp: 0 },
    memory: { level, difficulty: 1, xp: 0 },
    patterns: { level, difficulty: 1, xp: 0 },
});

const makeStats = () => ({
    phantomsCaught: 0,
    totalMobsDefeated: 5,
    totalBossesDefeated: 0,
    totalMinibossesDefeated: 0,
    totalDeaths: 0,
    uniqueMobsDefeated: [],
    uniqueBossesDefeated: [],
    uniqueMinibossesDefeated: [],
    themeChanges: 0,
    borderChanges: 0,
    battlesThisSession: 2,
    loginDates: [],
    perfectMemoryGames: 0,
    achievementsUnlocked: [],
});

describe('MenuDrawer', () => {
    installFakeIntersectionObserver();

    it('renders title when open', () => {
        render(<MenuDrawer isOpen={true} skills={makeSkills()} stats={makeStats()} />);
        expect(screen.getByText('Menu')).toBeInTheDocument();
    }, 15000);

    it('shows total level', () => {
        render(<MenuDrawer isOpen={true} skills={makeSkills(10)} stats={makeStats()} />);
        expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('applies translate-x-full when closed', () => {
        const { container } = render(<MenuDrawer isOpen={false} skills={makeSkills()} stats={makeStats()} />);
        expect(container.firstChild.className).toContain('translate-x-full');
    });

    it('applies translate-x-0 when open', () => {
        const { container } = render(<MenuDrawer isOpen={true} skills={makeSkills()} stats={makeStats()} />);
        expect(container.firstChild.className).toContain('translate-x-0');
    });

    it('renders skill sections', () => {
        render(<MenuDrawer isOpen={true} skills={makeSkills()} stats={makeStats()} />);
        const badges = screen.getAllByText('Badges');
        expect(badges.length).toBeGreaterThan(0);
    });

    it('renders achievement count', () => {
        render(<MenuDrawer isOpen={true} skills={makeSkills()} stats={makeStats()} />);
        const achievText = screen.getAllByText('Achievements');
        expect(achievText.length).toBeGreaterThan(0);
    });
});
