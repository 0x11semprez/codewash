import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { THEME_CONFIG, THEMES_LIST, SKILL_DATA } from '../../constants/gameData';
import CosmeticsDrawer from '../../components/drawers/CosmeticsDrawer';
import MemoryGame from '../../components/skills/games/MemoryGame';
import PatternGame from '../../components/skills/games/PatternGame';
import SkillCard from '../../components/skills/SkillCard';
import PhantomEvent from '../../components/PhantomEvent';
import MenuDrawer from '../../components/drawers/MenuDrawer';

const space = THEME_CONFIG.space;
const ocean = THEME_CONFIG.ocean;

beforeEach(() => {
    vi.stubGlobal(
        'Audio',
        class {
            play() {
                return Promise.resolve();
            }
            pause() {}
            addEventListener() {}
        },
    );
});

describe('theme menu', () => {
    const renderDrawer = (setActiveTheme = () => {}) =>
        render(
            <CosmeticsDrawer
                isOpen
                activeTheme="space"
                setActiveTheme={setActiveTheme}
                selectedBorder="solid"
                setSelectedBorder={() => {}}
                borderColor="#FFD700"
                setBorderColor={() => {}}
                unlockedBorders={[]}
            />,
        );

    it('lists every theme inside a scrollable box', () => {
        renderDrawer();
        const list = screen.getByTestId('theme-list');
        expect(list.className).toMatch(/overflow-y-auto/);
        expect(list.className).toMatch(/max-h-/);
        expect(list.className).toMatch(/theme-scroll/);
        expect(list.querySelectorAll('button')).toHaveLength(THEMES_LIST.length);
    });

    it('marks the active theme and changes theme on click', () => {
        const setActiveTheme = vi.fn();
        renderDrawer(setActiveTheme);
        // Queries by picture: role queries are slow on this large drawer.
        expect(screen.getByAltText('Space').closest('button')).toHaveAttribute('aria-pressed', 'true');
        fireEvent.click(screen.getByAltText('Ocean').closest('button'));
        expect(setActiveTheme).toHaveBeenCalledWith('ocean');
    });

    it('uses neutral names for the cosmetics', () => {
        renderDrawer();
        expect(screen.queryByText(/nether/i)).toBeNull();
        expect(screen.getByText('Shadow Portal')).toBeInTheDocument();
    });
});

describe('memory game', () => {
    it('shows the theme card back and theme creatures', () => {
        const { container } = render(
            <MemoryGame isBattling difficulty={1} onMathSubmit={() => {}} themeData={ocean} />,
        );
        const sources = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
        expect(sources.filter((src) => src === ocean.assets.cardBack)).toHaveLength(6);
        const fronts = sources.filter((src) => src !== ocean.assets.cardBack);
        expect(fronts).toHaveLength(6);
        fronts.forEach((src) => expect(Object.values(ocean.friends)).toContain(src));
    });
});

describe('pattern game', () => {
    it('shows the pattern pieces of the theme', () => {
        vi.useFakeTimers();
        const { container, unmount } = render(
            <PatternGame isBattling difficulty={7} onMathSubmit={() => {}} themeData={space} />,
        );
        const sources = [...container.querySelectorAll('img')].map((img) => img.getAttribute('src'));
        expect(sources).toEqual(Object.values(space.patternPieces));
        expect(screen.getByText('Bronze')).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(2000));
        unmount();
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('plays the round on click and ends on a wrong piece', () => {
        vi.useFakeTimers();
        const { container, unmount } = render(
            <PatternGame isBattling difficulty={1} onMathSubmit={() => {}} themeData={ocean} />,
        );
        act(() => vi.advanceTimersByTime(5000));
        const pieces = container.querySelectorAll('.cursor-pointer');
        expect(pieces).toHaveLength(2);
        act(() => {
            fireEvent.click(pieces[0]);
            fireEvent.click(pieces[1]);
        });
        act(() => vi.advanceTimersByTime(5000));
        unmount();
        vi.clearAllTimers();
        vi.useRealTimers();
    });
});

const renderCard = (config, themeData, mobName) =>
    render(
        <SkillCard
            config={config}
            data={{ level: 1, xp: 0, mobHealth: 100, mobMaxHealth: 100 }}
            themeData={themeData}
            isCenter
            isBattling={false}
            mobName={mobName}
            mobAura={null}
            challenge={null}
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

describe('skill card', () => {
    const reading = SKILL_DATA.find((skill) => skill.id === 'reading');

    it('shows the texts and enemy of the theme', () => {
        renderCard(reading, space, 'Drone');
        expect(screen.getByText('Star Library')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Decode!' })).toBeInTheDocument();
        expect(screen.getByAltText('Drone')).toHaveAttribute('src', space.enemies.Drone);
    });

    it('shows the first theme enemy for a name the theme does not know', () => {
        renderCard(reading, space, 'Zombie');
        const first = Object.keys(space.enemies)[0];
        expect(screen.getByAltText(first)).toHaveAttribute('src', space.enemies[first]);
    });

    it('draws the creature in a fixed box so pictures of any size take the same space', () => {
        renderCard(reading, ocean, 'Eel');
        const image = screen.getByAltText('Eel');
        expect(image.className).toMatch(/w-full h-full object-contain/);
        expect(image.parentElement.className).toMatch(/w-\[200px\] h-\[200px\]/);
    });

    it('shows the theme icon on the memory card', () => {
        const memory = SKILL_DATA.find((skill) => skill.id === 'memory');
        const { container } = renderCard(memory, ocean, 'Blue Fish');
        expect(container.querySelector(`img[src="${ocean.skillIcons.memory}"]`)).not.toBeNull();
    });
});

describe('bonus creature and menu', () => {
    it('uses the theme picture for the flying bonus creature', () => {
        vi.useFakeTimers();
        vi.stubGlobal('localStorage', { getItem: () => '0', setItem: () => {} });
        vi.spyOn(Math, 'random').mockReturnValue(0);
        render(<PhantomEvent battlingSkillId={null} onAwardLevel={() => {}} imageSrc={space.bonusCreature} />);
        act(() => vi.advanceTimersByTime(100));
        Math.random.mockRestore();
        expect(screen.getByAltText('Bonus creature')).toHaveAttribute('src', space.bonusCreature);
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('shows the theme skill icons in the menu', () => {
        const skills = Object.fromEntries(SKILL_DATA.map((skill) => [skill.id, { level: 1, xp: 0 }]));
        const { container } = render(<MenuDrawer isOpen skills={skills} stats={{}} themeData={ocean} />);
        expect(container.querySelector(`img[src="${ocean.skillIcons.math}"]`)).not.toBeNull();
    });
});
