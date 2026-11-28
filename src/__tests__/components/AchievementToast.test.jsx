import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AchievementToast from '../../components/ui/AchievementToast';

describe('AchievementToast', () => {
    it('renders nothing for an unknown achievement', () => {
        const { container } = render(<AchievementToast achievementId="nonexistent" />);
        expect(container.firstChild).toBeNull();
    });

    it('shows the name and description of a simple achievement', () => {
        render(<AchievementToast achievementId="first_steps" />);
        expect(screen.getByText('ACHIEVEMENT UNLOCKED!')).toBeInTheDocument();
        expect(screen.getByText(/First Steps/i)).toBeInTheDocument();
    });

    it('uses a description override when provided', () => {
        render(<AchievementToast achievementId="game_loaded" descriptionOverride="Loaded in 0.42s" />);
        expect(screen.getByText('Loaded in 0.42s')).toBeInTheDocument();
    });

    it('shows the tier name and color for a tiered achievement', () => {
        const { container } = render(<AchievementToast achievementId="phantom_hunter" tierIndex={2} />);
        expect(screen.getByText(/Tier/i)).toBeInTheDocument();
        const border = container.querySelector('[style]');
        expect(border).not.toBeNull();
    });

    it('falls back to gold border when no tier is given', () => {
        const { container } = render(<AchievementToast achievementId="first_steps" />);
        const inner = container.querySelector('.bg-black\\/90');
        expect(inner.style.border).toContain('rgb(255, 215, 0)');
    });
});
