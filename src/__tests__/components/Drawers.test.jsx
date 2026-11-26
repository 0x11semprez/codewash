import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MenuDrawer from '../../components/drawers/MenuDrawer';
import CosmeticsDrawer from '../../components/drawers/CosmeticsDrawer';
import { SKILL_DATA, getTheme } from '../../constants/gameData';

const skillsAt = (level, extra = {}) =>
    Object.fromEntries(SKILL_DATA.map((skill) => [skill.id, { level, xp: 0, difficulty: 1, ...extra }]));

// The description text is unique per effect, so it finds the button of one effect.
const effectButton = (description) => screen.getByText(description).closest('button');

describe('MenuDrawer', () => {
    it('slides out when closed and skips re-rendering while it stays closed', () => {
        const { container, rerender } = render(<MenuDrawer isOpen={false} skills={skillsAt(1)} stats={{}} />);
        expect(container.firstChild.className).toContain('translate-x-full');
        rerender(<MenuDrawer isOpen={false} skills={skillsAt(7)} stats={{}} />);
        expect(screen.getByText('6')).toBeInTheDocument();
        rerender(<MenuDrawer isOpen skills={skillsAt(7)} stats={{}} />);
        expect(container.firstChild.className).toContain('translate-x-0');
        expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('shows one legendary badge at level 180 and a counter from two legendary badges', () => {
        const skills = { ...skillsAt(1), reading: { level: 180, xp: 0 }, math: { level: 200, xp: 0 } };
        render(<MenuDrawer isOpen skills={skills} stats={{}} />);
        expect(screen.getAllByTitle('LEGENDARY!')).toHaveLength(2);
        expect(screen.getByText('2', { selector: 'span.text-xs' })).toBeInTheDocument();
    });

    it('lists a saved skill the game no longer has, without an icon', () => {
        const skills = { ...skillsAt(1), oldSkill: { level: 3, xp: 0 } };
        const { container } = render(<MenuDrawer isOpen skills={skills} stats={{}} />);
        expect(screen.getByText('Lvl 3')).toBeInTheDocument();
        expect(container.querySelector('img[alt="oldSkill"]')).toBeNull();
    });

    it("shows the skill's own icon when the theme has none for it", () => {
        const themeData = { ...getTheme(), skillIcons: {} };
        const { container } = render(<MenuDrawer isOpen skills={skillsAt(1)} stats={{}} themeData={themeData} />);
        const math = SKILL_DATA.find((skill) => skill.id === 'math');
        expect(container.querySelector('img[alt="math"]')).toHaveAttribute('src', math.img);
    });

    it('marks a tiered achievement at its last tier as maxed', () => {
        render(<MenuDrawer isOpen skills={skillsAt(1)} stats={{ phantomsCaught: 500 }} />);
        expect(screen.getByText('MAX TIER REACHED!')).toBeInTheDocument();
    });

    it('colors a tiered achievement by its current tier and shows the next goal', () => {
        render(<MenuDrawer isOpen skills={skillsAt(1)} stats={{ phantomsCaught: 6 }} />);
        expect(screen.getAllByText('Progress: 6').length).toBeGreaterThan(0);
        expect(screen.getByText('Next: 10')).toBeInTheDocument();
    });
});

describe('CosmeticsDrawer', () => {
    const renderDrawer = (props = {}) => {
        const handlers = { setActiveTheme: vi.fn(), setSelectedBorder: vi.fn(), setBorderColor: vi.fn() };
        const view = render(
            <CosmeticsDrawer
                isOpen
                activeTheme="blocks"
                selectedBorder="solid"
                borderColor="#00ff00"
                unlockedBorders={['Wood', 'Stone']}
                unlockedAchievements={['perfectionist']}
                {...handlers}
                {...props}
            />,
        );
        return { ...view, ...handlers };
    };

    it('slides out when closed and skips re-rendering while it stays closed', () => {
        const props = {
            activeTheme: 'blocks',
            setActiveTheme: vi.fn(),
            selectedBorder: 'solid',
            setSelectedBorder: vi.fn(),
            borderColor: '#00ff00',
            setBorderColor: vi.fn(),
            unlockedBorders: [],
        };
        const { container, rerender } = render(<CosmeticsDrawer isOpen={false} {...props} />);
        expect(container.firstChild.className).toContain('-translate-x-full');
        rerender(<CosmeticsDrawer isOpen={false} {...props} selectedBorder="solid-picker" />);
        expect(effectButton('Eternal golden radiance')).toHaveTextContent('ACTIVE');
    });

    it('selects an unlocked border and marks the selected one as active', () => {
        const { setSelectedBorder } = renderDrawer();
        expect(effectButton('Eternal golden radiance')).toHaveTextContent('ACTIVE');
        expect(effectButton('Eternal golden radiance').className).toContain('border-yellow-400');
        fireEvent.click(effectButton('Mesmerizing arcane rotation'));
        expect(setSelectedBorder).toHaveBeenCalledWith('gradient');
    });

    it('keeps locked borders disabled and explains which badge opens them', () => {
        const { setSelectedBorder } = renderDrawer();
        const locked = effectButton('Thunderous plasma surge');
        expect(locked).toBeDisabled();
        fireEvent.click(locked);
        expect(setSelectedBorder).not.toHaveBeenCalled();
        expect(screen.getByText('Iron Badge Required')).toBeInTheDocument();
    });

    it('opens and closes the color picker of the custom border, and changes the color', () => {
        const { setBorderColor, setSelectedBorder, container } = renderDrawer({ selectedBorder: 'solid-picker' });
        const picker = effectButton('Customizable eternal glow');
        expect(container.querySelector('input[type="color"]')).toBeNull();

        fireEvent.click(picker);
        const input = container.querySelector('input[type="color"]');
        expect(screen.getByText('#00FF00')).toBeInTheDocument();
        fireEvent.click(input);
        expect(container.querySelector('input[type="color"]')).not.toBeNull();
        fireEvent.change(input, { target: { value: '#123456' } });
        expect(setBorderColor).toHaveBeenCalledWith('#123456');

        fireEvent.click(picker);
        expect(container.querySelector('input[type="color"]')).toBeNull();
        expect(setSelectedBorder).not.toHaveBeenCalled();
    });

    it('selects an achievement border once its achievement is unlocked', () => {
        const { setSelectedBorder } = renderDrawer({ selectedBorder: 'holo' });
        const holo = effectButton('Digital reality glitch');
        expect(holo).toHaveTextContent('ACTIVE');
        fireEvent.click(holo);
        expect(setSelectedBorder).toHaveBeenCalledWith('holo');

        fireEvent.click(effectButton('Digital reality glitch'));
        const locked = effectButton('Volatile electric arcs');
        expect(locked).toBeDisabled();
    });

    it('selects an unlocked achievement border that is not active yet', () => {
        const { setSelectedBorder } = renderDrawer();
        const holo = effectButton('Digital reality glitch');
        expect(holo).not.toHaveTextContent('ACTIVE');
        fireEvent.click(holo);
        expect(setSelectedBorder).toHaveBeenCalledWith('holo');
    });

    it('treats a missing achievement list as nothing unlocked', () => {
        renderDrawer({ unlockedAchievements: undefined });
        expect(effectButton('Digital reality glitch')).toBeDisabled();
    });
});
