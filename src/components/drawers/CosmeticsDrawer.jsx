import React, { useState } from 'react';
import {
    Sparkles,
    Flame,
    Snowflake,
    Zap,
    Skull,
    Star,
    Activity,
    Atom,
    Droplet,
    Grid3x3,
    Gem,
    Info,
} from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import { THEMES_LIST, getTheme } from '../../constants/gameData';
import { themeName } from '../../i18n/gameText';
import { ACHIEVEMENTS } from '../../constants/achievements';
import { pauseWhenOffscreen } from '../../hooks/useAnimationPause';
import { useTranslation } from '../../i18n/useTranslation';
import BorderEffectCard from './BorderEffectCard';
import { achievementDescription, achievementName } from '../../i18n/gameText';
import styles from './CosmeticsDrawer.module.css';
import borderEffects from '../../styles/borderEffects.module.css';

const BORDER_EFFECTS = [
    { id: 'solid', badge: null, icon: Star },
    { id: 'solid-picker', badge: 'Wood', icon: Star },
    { id: 'gradient', badge: 'Stone', icon: Atom },
    { id: 'sparkle', badge: 'Gold', icon: Sparkles },
    { id: 'electric', badge: 'Iron', icon: Zap },
    { id: 'lifestream', badge: 'Emerald', icon: Activity },
    { id: 'frost', badge: 'Diamond', icon: Snowflake },
    { id: 'fire', badge: 'Titanium', icon: Flame },
    { id: 'shadow', badge: 'Obsidian', icon: Skull },
    { id: 'rainbow', badge: 'Star', icon: Gem },
];

// Achievement-unlocked border effects
const ACHIEVEMENT_EFFECTS = [
    { id: 'livewire', achievement: 'speed_demon', icon: Zap },
    { id: 'void', achievement: 'world_ender', icon: Atom },
    { id: 'toxic', achievement: 'monster_manual', icon: Droplet },
    { id: 'holo', achievement: 'perfectionist', icon: Grid3x3 },
    { id: 'crystal', achievement: 'full_set', icon: Gem },
];

const CosmeticsDrawer = ({
    isOpen,
    activeTheme,
    setActiveTheme,
    selectedBorder,
    setSelectedBorder,
    borderColor,
    setBorderColor,
    unlockedBorders,
    unlockedAchievements = [], // New prop for unlocked achievements
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    const { t, language } = useTranslation();

    const isBorderUnlocked = (badge) => {
        // Default (locked on yellow) is always unlocked
        if (badge === null) return true;
        // Check if the badge is unlocked
        return unlockedBorders.includes(badge);
    };

    const isAchievementEffectUnlocked = (achievementId) => {
        return unlockedAchievements.includes(achievementId);
    };

    return (
        <div
            ref={pauseWhenOffscreen}
            className={`fixed h-full w-[85%] md:w-[60%] bg-[#0f172a]/95 backdrop-blur-xl z-50 border-r-4 border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ top: 0, left: 0 }}
        >
            <div className="p-6 h-full flex flex-col justify-start gap-6 overflow-y-auto scrollbar-hide text-slate-200 font-sans">
                <div className="flex justify-between items-center border-b-2 border-slate-700 pb-4 shrink-0">
                    <h2
                        className="text-4xl text-yellow-400 font-bold uppercase tracking-widest drop-shadow-md"
                        style={{ fontFamily: '"VT323", monospace' }}
                    >
                        {t('cosmetics.title')}
                    </h2>
                </div>

                {/* Theme Selection */}
                <div>
                    <h3 className="text-xl text-blue-300 mb-5 font-bold flex items-center gap-3 uppercase tracking-wider">
                        <Sparkles size={20} /> {t('cosmetics.themeSelect')}
                    </h3>
                    {/* Two rows are visible. The bar on the right scrolls to the other themes. */}
                    <div
                        data-testid="theme-list"
                        role="group"
                        aria-label={t('cosmetics.themeList')}
                        className={`${styles['theme-scroll']} grid grid-cols-2 gap-4 max-h-[14.5rem] overflow-y-auto p-2 pr-3`}
                    >
                        {THEMES_LIST.map((theme) => (
                            <button
                                key={theme.id}
                                onClick={() => setActiveTheme(theme.id)}
                                disabled={activeTheme === theme.id}
                                aria-pressed={activeTheme === theme.id}
                                className={`h-24 shrink-0 rounded-lg border-2 overflow-hidden relative transition-all duration-300 shadow-lg group ${
                                    activeTheme === theme.id
                                        ? 'border-yellow-400 ring-2 ring-yellow-400/20 opacity-100 cursor-default'
                                        : 'border-slate-600 hover:scale-105 hover:border-white opacity-60 hover:opacity-100'
                                }`}
                            >
                                <SafeImage
                                    src={theme.img}
                                    alt={themeName(getTheme(theme.id), language)}
                                    className={`w-full h-full object-cover ${activeTheme === theme.id ? 'grayscale-0' : 'grayscale'}`}
                                />
                                <div
                                    className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                                        activeTheme === theme.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                >
                                    <span
                                        className={`text-lg font-bold uppercase tracking-widest ${
                                            activeTheme === theme.id ? 'text-yellow-400' : 'text-white'
                                        }`}
                                    >
                                        {themeName(getTheme(theme.id), language)}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Border Effect Selection - Optimized Grid Layout */}
                <div>
                    <h3 className="text-xl text-blue-300 mb-4 font-bold flex items-center gap-3 uppercase tracking-wider">
                        <Sparkles size={20} /> {t('cosmetics.borderEffects')}
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {BORDER_EFFECTS.map((effect, index) => {
                            const unlocked = isBorderUnlocked(effect.badge);
                            const isSelected = selectedBorder === effect.id;
                            const isSolid = effect.id === 'solid' || effect.id === 'solid-picker';
                            const solidColor = effect.id === 'solid' ? '#FFD700' : borderColor;
                            const IconComponent = effect.icon;
                            let previewStyle = {};
                            if (isSolid)
                                previewStyle = { borderColor: solidColor, boxShadow: `0 0 20px ${solidColor}` };
                            else if (effect.id === 'gradient' || effect.id === 'sparkle') {
                                previewStyle = { '--border-color': borderColor };
                            }

                            return (
                                <BorderEffectCard
                                    key={effect.id}
                                    effect={effect}
                                    unlocked={unlocked}
                                    isSelected={isSelected}
                                    gridIndex={index}
                                    previewClassName={isSolid ? '' : borderEffects[`border-effect-${effect.id}`]}
                                    previewStyle={previewStyle}
                                    onClick={() => {
                                        if (effect.id === 'solid-picker' && isSelected) {
                                            setShowColorPicker(!showColorPicker);
                                        } else {
                                            setSelectedBorder(effect.id);
                                            setShowColorPicker(false);
                                        }
                                    }}
                                    extra={
                                        effect.id === 'solid-picker' &&
                                        isSelected &&
                                        showColorPicker && (
                                            <div className="mt-2 p-2 bg-slate-900/80 rounded border border-slate-600 w-full">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={borderColor}
                                                        onChange={(e) => setBorderColor(e.target.value)}
                                                        className="w-10 h-10 rounded cursor-pointer border-2 border-slate-600"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="text-[9px] text-slate-400 mb-0.5">
                                                            {t('cosmetics.color')}
                                                        </div>
                                                        <div className="text-[11px] font-mono text-white">
                                                            {borderColor.toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    }
                                    tooltipWidth="w-48"
                                    tooltip={
                                        !unlocked &&
                                        effect.badge && (
                                            <>
                                                <div className="flex items-start gap-2 mb-2">
                                                    <div className="p-1.5 rounded bg-slate-700">
                                                        <IconComponent size={20} className="text-slate-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-slate-300">
                                                            {t('cosmetics.badgeRequired', {
                                                                badge: t(`badges.${effect.badge}`),
                                                            })}
                                                        </h4>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {t('cosmetics.earnBadge', {
                                                                badge: t(`badges.${effect.badge}`),
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-xs px-2 py-1 rounded bg-red-900/30 text-red-400">
                                                    {t('cosmetics.locked')}
                                                </div>
                                            </>
                                        )
                                    }
                                />
                            );
                        })}

                        {/* Achievement-unlocked effects come after the badge effects in the same grid. */}
                        {ACHIEVEMENT_EFFECTS.map((effect, index) => {
                            const unlocked = isAchievementEffectUnlocked(effect.achievement);
                            const IconComponent = effect.icon;
                            const achievement = ACHIEVEMENTS[effect.achievement];

                            return (
                                <BorderEffectCard
                                    key={effect.id}
                                    effect={effect}
                                    unlocked={unlocked}
                                    isSelected={selectedBorder === effect.id}
                                    gridIndex={BORDER_EFFECTS.length + index}
                                    previewClassName={borderEffects[`border-effect-${effect.id}`]}
                                    onClick={() => {
                                        setSelectedBorder(effect.id);
                                        setShowColorPicker(false);
                                    }}
                                    tooltipWidth="w-64"
                                    tooltip={
                                        <>
                                            <div className="flex items-start gap-2 mb-2">
                                                {achievement && (
                                                    <>
                                                        <div
                                                            className={`p-1.5 rounded ${unlocked ? 'bg-yellow-400/20' : 'bg-slate-700'}`}
                                                        >
                                                            <IconComponent
                                                                size={20}
                                                                className={
                                                                    unlocked ? 'text-yellow-400' : 'text-slate-400'
                                                                }
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4
                                                                className={`text-sm font-bold ${unlocked ? 'text-yellow-400' : 'text-slate-300'}`}
                                                            >
                                                                {achievementName(t, achievement)}
                                                            </h4>
                                                            <p className="text-xs text-slate-400 mt-0.5">
                                                                {achievementDescription(t, achievement)}
                                                            </p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                            <div
                                                className={`text-xs px-2 py-1 rounded ${unlocked ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}
                                            >
                                                {unlocked ? t('cosmetics.unlocked') : t('cosmetics.locked')}
                                            </div>
                                        </>
                                    }
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Preserve the open/close transition while skipping updates that only affect
// this hidden drawer's stale contents. The latest props are used when it opens.
export default React.memo(CosmeticsDrawer, (previousProps, nextProps) => !previousProps.isOpen && !nextProps.isOpen);
