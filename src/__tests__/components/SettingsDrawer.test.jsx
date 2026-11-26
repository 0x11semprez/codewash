import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import SettingsDrawer from '../../components/drawers/SettingsDrawer';
import ProfileCard from '../../components/profile/ProfileCard';
import { SKILL_DATA, THEME_CONFIG } from '../../constants/gameData';

vi.mock('../../services/soundManager', () => ({ playClick: vi.fn() }));

const renderDrawer = (props = {}) => {
    const handlers = {
        onReset: vi.fn(),
        setBgmVol: vi.fn(),
        setSfxVol: vi.fn(),
        onSwitchProfile: vi.fn(),
        onRenameProfile: vi.fn(),
        onParentVerified: vi.fn(),
        getProfileStats: vi.fn((id, live) => (live ? { totalLevel: 12, skills: live } : null)),
    };
    const view = render(
        <SettingsDrawer
            isOpen
            bgmVol={0.5}
            sfxVol={0.25}
            currentProfile={1}
            profileNames={{ 1: 'Ana', 2: 'Ben', 3: 'Cy' }}
            parentStatus={{ 1: false, 2: true, 3: false }}
            currentSkills={{ math: { level: 3 } }}
            {...handlers}
            {...props}
        />,
    );
    return { ...view, ...handlers };
};

describe('SettingsDrawer', () => {
    it('slides in when open and out when closed', () => {
        const { container, rerender, ...handlers } = renderDrawer();
        expect(container.firstChild.className).toContain('translate-x-0');
        rerender(
            <SettingsDrawer
                isOpen={false}
                bgmVol={0.5}
                sfxVol={0.25}
                currentProfile={1}
                profileNames={{}}
                parentStatus={null}
                currentSkills={{}}
                {...handlers}
            />,
        );
        expect(container.firstChild.className).toContain('-translate-x-full');
    });

    it('skips re-rendering its hidden content while it stays closed', () => {
        const props = {
            bgmVol: 0.5,
            sfxVol: 0.25,
            currentProfile: 1,
            profileNames: {},
            parentStatus: {},
            currentSkills: {},
            getProfileStats: () => null,
        };
        const { rerender } = render(<SettingsDrawer isOpen={false} {...props} />);
        rerender(<SettingsDrawer isOpen={false} {...props} bgmVol={0.9} />);
        expect(screen.getByText('50%')).toBeInTheDocument();
        rerender(<SettingsDrawer isOpen {...props} bgmVol={0.9} />);
        expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('shows the live stats for the open profile and the saved stats for the others', () => {
        const { getProfileStats } = renderDrawer();
        expect(getProfileStats).toHaveBeenCalledWith(1, { math: { level: 3 } });
        expect(getProfileStats).toHaveBeenCalledWith(2);
        expect(getProfileStats).toHaveBeenCalledWith(3);
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('changes both volumes and asks to delete the progress', () => {
        const { setBgmVol, setSfxVol, onReset } = renderDrawer();
        expect(screen.getByText('50%')).toBeInTheDocument();
        expect(screen.getByText('25%')).toBeInTheDocument();
        const [music, sfx] = screen.getAllByRole('slider');
        fireEvent.change(music, { target: { value: '0.8' } });
        fireEvent.change(sfx, { target: { value: '0.1' } });
        expect(setBgmVol).toHaveBeenCalledWith(0.8);
        expect(setSfxVol).toHaveBeenCalledWith(0.1);
        fireEvent.click(screen.getByText('DELETE PROFILE PROGRESS'));
        expect(onReset).toHaveBeenCalledOnce();
    });
});

describe('ProfileCard', () => {
    const renderCard = (props = {}) => {
        const handlers = { onSwitch: vi.fn(), onRename: vi.fn(), onParentVerified: vi.fn() };
        const view = render(
            <ProfileCard id={2} name="Ben" stats={null} isCurrent={false} isParent={false} {...handlers} {...props} />,
        );
        return { ...view, ...handlers };
    };

    it('switches to this profile when clicked', () => {
        const { onSwitch } = renderCard();
        fireEvent.click(screen.getByText('Ben,'));
        expect(onSwitch).toHaveBeenCalledWith(2);
        expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('renames the open profile, without switching while editing', () => {
        const { onRename, onSwitch, container } = renderCard({ isCurrent: true });
        fireEvent.click(container.querySelector('svg.lucide-pencil'));
        const input = screen.getByDisplayValue('Ben');
        fireEvent.change(input, { target: { value: 'Benji' } });
        fireEvent.click(input);
        fireEvent.click(container.firstChild);
        expect(onSwitch).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Save name' }));
        expect(onRename).toHaveBeenCalledWith(2, 'Benji');
        expect(screen.queryByDisplayValue('Benji')).toBeNull();
    });

    it('stops editing when another profile becomes the open one', () => {
        const props = { id: 2, name: 'Ben', stats: null, isParent: false, onSwitch: vi.fn(), onRename: vi.fn() };
        const { container, rerender } = render(<ProfileCard {...props} isCurrent />);
        fireEvent.click(container.querySelector('svg.lucide-pencil'));
        expect(screen.getByDisplayValue('Ben')).toBeInTheDocument();
        rerender(<ProfileCard {...props} isCurrent={false} />);
        expect(screen.queryByDisplayValue('Ben')).toBeNull();
    });

    it('asks the parent question before marking a parent, and can be closed', () => {
        const { onParentVerified, onSwitch } = renderCard();
        fireEvent.click(screen.getByRole('checkbox'));
        expect(onSwitch).not.toHaveBeenCalled();
        expect(screen.getByText('What is this?')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Close' }));
        expect(screen.queryByText('What is this?')).toBeNull();

        fireEvent.click(screen.getByRole('checkbox'));
        const answer = screen.getAllByRole('textbox').at(-1);
        fireEvent.change(answer, { target: { value: 'FLOPPYDISK' } });
        fireEvent.click(screen.getByText('Submit'));
        expect(onParentVerified).toHaveBeenCalledWith(2, true);
        expect(screen.queryByText('What is this?')).toBeNull();
    });

    it('closes the parent question even when nobody listens for the answer', () => {
        renderCard({ onParentVerified: undefined });
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.change(screen.getAllByRole('textbox').at(-1), { target: { value: 'FLOPPYDISK' } });
        fireEvent.click(screen.getByText('Submit'));
        expect(screen.queryByText('What is this?')).toBeNull();
    });

    it('shows a crown and a rainbow ring for the open parent profile', () => {
        const { container } = renderCard({ isCurrent: true, isParent: true });
        expect(screen.getByText('Parent')).toBeInTheDocument();
        expect(screen.queryByRole('checkbox')).toBeNull();
        expect(container.firstChild.className).toContain('ring-rainbow');
        expect(container.firstChild.style.boxShadow).toContain('255, 215, 0');
    });

    it('shows a yellow ring for the open profile of a child', () => {
        const { container } = renderCard({ isCurrent: true });
        expect(container.firstChild.className).toContain('ring-yellow-400');
    });

    it('uses the background of the profile theme and colors each skill level', () => {
        const levels = { reading: 2, math: 25, writing: 70, cleaning: 120, memory: 170, patterns: 1 };
        const skills = Object.fromEntries(Object.entries(levels).map(([id, level]) => [id, { level }]));
        const { container } = renderCard({ stats: { totalLevel: 388, theme: 'space', skills } });
        expect(container.querySelector(`img[src="${THEME_CONFIG.space.assets.background}"]`)).not.toBeNull();
        const badge = (level) => screen.getAllByText(String(level))[0];
        expect(badge(2).className).toContain('text-white');
        expect(badge(25).className).toContain('text-amber-700');
        expect(badge(70).className).toContain('text-yellow-400');
        expect(badge(120).className).toContain('text-emerald-400');
        expect(badge(170).className).toContain('text-rainbow');
    });

    it("falls back to the skill's own icon when the theme has none for it", () => {
        const icons = THEME_CONFIG.blocks.skillIcons;
        const saved = icons.math;
        delete icons.math;
        try {
            const { container } = renderCard({ stats: { totalLevel: 1, theme: 'blocks', skills: {} } });
            const math = SKILL_DATA.find((skill) => skill.id === 'math');
            expect(container.querySelector(`img[src="${math.img}"]`)).not.toBeNull();
        } finally {
            icons.math = saved;
        }
    });

    it('keeps unknown skills locked when the save has no skill list', () => {
        const { container } = renderCard({ stats: { totalLevel: 0 } });
        expect(within(container).queryAllByText('1')).toEqual([]);
        expect(container.querySelectorAll('.grayscale').length).toBeGreaterThan(0);
    });
});
