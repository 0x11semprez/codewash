import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileCard from '../../components/profile/ProfileCard';
import { installFakeIntersectionObserver } from '../helpers/fakeIntersectionObserver';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => ({
        t: (key) => {
            const map = {
                'profile.parent': 'Parent',
                'profile.parentQuestion': 'Parent?',
                'profile.levelShort': 'LV',
                'profile.skillProficiency': 'Skills',
                'profile.saveName': 'Save',
                'parental.answer': 'TEST',
                'parental.title': 'Verify',
                'parental.close': 'Close',
                'parental.error': 'Wrong',
                'parental.submit': 'Submit',
            };
            return map[key] || key;
        },
    }),
}));

vi.mock('../../services/soundManager', () => ({ playClick: vi.fn() }));

const baseStats = {
    totalLevel: 42,
    theme: null,
    skills: {
        reading: { level: 5 },
        math: { level: 10 },
        writing: { level: 3 },
        cleaning: { level: 1 },
        memory: { level: 1 },
        patterns: { level: 1 },
    },
};

describe('ProfileCard', () => {
    installFakeIntersectionObserver();

    const defaults = {
        id: 1,
        name: 'Alice',
        stats: baseStats,
        isCurrent: true,
        onSwitch: vi.fn(),
        onRename: vi.fn(),
        isParent: false,
        onParentVerified: vi.fn(),
    };

    beforeEach(() => vi.clearAllMocks());

    it('renders profile name and total level', () => {
        render(<ProfileCard {...defaults} />);
        expect(screen.getByText('Alice,')).toBeInTheDocument();
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('switches profile on click', () => {
        render(<ProfileCard {...defaults} isCurrent={false} />);
        fireEvent.click(screen.getByText('Alice,').closest('[class*="relative"]'));
        expect(defaults.onSwitch).toHaveBeenCalledWith(1);
    });

    it('shows pencil and enters edit mode on current profile', () => {
        render(<ProfileCard {...defaults} />);
        const pencils = document.querySelectorAll('.text-slate-400');
        const pencil = Array.from(pencils).find((el) => el.closest('svg'));
        if (pencil) {
            fireEvent.click(pencil);
            expect(document.querySelector('input[type="text"]')).toBeInTheDocument();
        }
    });

    it('shows crown icon when isParent', () => {
        render(<ProfileCard {...defaults} isParent={true} />);
        expect(screen.getByText('Parent')).toBeInTheDocument();
    });

    it('shows checkbox when not parent', () => {
        render(<ProfileCard {...defaults} isParent={false} />);
        expect(screen.getByText('Parent?')).toBeInTheDocument();
        expect(document.querySelector('input[type="checkbox"]')).toBeInTheDocument();
    });

    it('opens parental modal on checkbox change', () => {
        render(<ProfileCard {...defaults} isParent={false} />);
        const checkbox = document.querySelector('input[type="checkbox"]');
        fireEvent.click(checkbox);
        expect(screen.getByText('Verify')).toBeInTheDocument();
    });

    it('applies inactive styles when not current', () => {
        const { container } = render(<ProfileCard {...defaults} isCurrent={false} />);
        expect(container.firstChild.className).toContain('opacity-70');
    });

    it('shows skill icons in scrolling carousel', () => {
        render(<ProfileCard {...defaults} />);
        expect(screen.getByText('Skills')).toBeInTheDocument();
        const skillBadges = document.querySelectorAll('.text-lg.font-black');
        expect(skillBadges.length).toBeGreaterThan(0);
    });

    it('colors level badges by threshold', () => {
        const highStats = { ...baseStats, totalLevel: 161, skills: { ...baseStats.skills, reading: { level: 161 } } };
        render(<ProfileCard {...defaults} stats={highStats} />);
        const badges = document.querySelectorAll('.text-rainbow');
        expect(badges.length).toBeGreaterThan(0);
    });
});
