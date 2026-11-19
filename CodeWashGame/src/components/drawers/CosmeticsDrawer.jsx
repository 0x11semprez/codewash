import React, { useState } from 'react';
import { Sparkles, Flame, Snowflake, Zap, Skull, Star, Activity, Atom, Droplet, Grid3x3, Gem } from 'lucide-react';
import SafeImage from '../ui/SafeImage';
import { THEMES_LIST } from '../../constants/gameData';
import { ACHIEVEMENTS } from '../../constants/achievements';
import BorderEffectCard from './BorderEffectCard';

const BORDER_EFFECTS = [
    { id: 'solid', name: 'Default', badge: null, description: 'Eternal golden radiance', icon: Star },
    { id: 'solid-picker', name: 'Default', badge: 'Wood', description: 'Customizable eternal glow', icon: Star },
    { id: 'gradient', name: 'Copper', badge: 'Stone', description: 'Mesmerizing arcane rotation', icon: Atom },
    { id: 'sparkle', name: 'Cloudy', badge: 'Gold', description: 'Celestial stardust shimmer', icon: Sparkles },
    { id: 'electric', name: 'Lightning Rod', badge: 'Iron', description: 'Thunderous plasma surge', icon: Zap },
    { id: 'lifestream', name: 'Lifestream', badge: 'Emerald', description: 'Flowing ethereal energy', icon: Activity },
    { id: 'frost', name: 'Frost', badge: 'Diamond', description: 'Glacial crystal majesty', icon: Snowflake },
    { id: 'fire', name: 'Lava', badge: 'Netherite', description: 'Infernal blazing fury', icon: Flame },
    { id: 'shadow', name: 'Nether Portal', badge: 'Obsidian', description: 'Abyssal void whispers', icon: Skull },
    { id: 'rainbow', name: 'Legendary!', badge: 'Star', description: 'Prismatic legendary aura', icon: Gem }
];

// Achievement-unlocked border effects
const ACHIEVEMENT_EFFECTS = [
    { id: 'livewire', name: 'Live Wire', achievement: 'speed_demon', description: 'Volatile electric arcs', icon: Zap },
    { id: 'void', name: 'Cosmic Void', achievement: 'world_ender', description: 'Infinite starlit expanse', icon: Atom },
    { id: 'toxic', name: 'Toxin', achievement: 'monster_manual', description: 'Caustic acid drip', icon: Droplet },
    { id: 'holo', name: 'Hologram', achievement: 'perfectionist', description: 'Digital reality glitch', icon: Grid3x3 },
    { id: 'crystal', name: 'Crystalline', achievement: 'full_set', description: 'Prismatic shard array', icon: Gem }
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
    unlockedAchievements = [] // New prop for unlocked achievements
}) => {
    const [showColorPicker, setShowColorPicker] = useState(false);
    
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
            className={`fixed h-full w-[85%] md:w-[60%] bg-[#0f172a]/95 backdrop-blur-xl z-50 border-r-4 border-slate-700 shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
            style={{ top: 0, left: 0 }}
        >
            <div className="p-6 h-full flex flex-col justify-start gap-6 overflow-y-auto scrollbar-hide text-slate-200 font-sans">
                <div className="flex justify-between items-center border-b-2 border-slate-700 pb-4 shrink-0">
                    <h2 className="text-4xl text-yellow-400 font-bold uppercase tracking-widest drop-shadow-md" style={{ fontFamily: '"VT323", monospace' }}>
                        Themes & Cosmetics
                    </h2>
                </div>
                
                {/* Theme Selection */}
                <div>
                    <h3 className="text-xl text-blue-300 mb-5 font-bold flex items-center gap-3 uppercase tracking-wider">
                        <Sparkles size={20} /> Theme Select
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {THEMES_LIST.map(theme => (
                            <button 
                                key={theme.id} 
                                onClick={() => setActiveTheme(theme.id)} 
                                disabled={activeTheme === theme.id} 
                                className={`h-24 rounded-lg border-2 overflow-hidden relative transition-all duration-300 shadow-lg group ${
                                    activeTheme === theme.id 
                                        ? 'border-yellow-400 ring-2 ring-yellow-400/20 opacity-100 cursor-default' 
                                        : 'border-slate-600 hover:scale-105 hover:border-white opacity-60 hover:opacity-100'
                                }`}
                            >
                                <SafeImage 
                                    src={theme.img} 
                                    alt={theme.name} 
                                    className={`w-full h-full object-cover ${activeTheme === theme.id ? 'grayscale-0' : 'grayscale'}`} 
                                />
                                <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                                    activeTheme === theme.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}>
                                    <span className={`text-lg font-bold uppercase tracking-widest ${
                                        activeTheme === theme.id ? 'text-yellow-400' : 'text-white'
                                    }`}>
                                        {theme.name}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Border Effect Selection - Optimized Grid Layout */}
                <div>
                    <h3 className="text-xl text-blue-300 mb-4 font-bold flex items-center gap-3 uppercase tracking-wider">
                        <Sparkles size={20} /> Border Effects
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {/* All border effects (badge-unlocked and achievement-unlocked) */}
                        {BORDER_EFFECTS.map((effect, index) => {
                            const unlocked = isBorderUnlocked(effect.badge);
                            const isSelected = selectedBorder === effect.id;
                            const isSolid = effect.id === 'solid' || effect.id === 'solid-picker';
                            const showPicker = effect.id === 'solid-picker' && isSelected && showColorPicker;
                            const IconComponent = effect.icon;
                            const columnIndex = index % 3; // 0 = first column, 1 = middle, 2 = third column
                            const tooltipPosition = columnIndex === 2 ? 'right-full mr-2' : 'left-full ml-2';
                            const color = effect.id === 'solid' ? '#FFD700' : borderColor;
                            const previewStyle = {
                                className: !isSolid ? `border-effect-${effect.id}` : '',
                                style: isSolid
                                    ? { borderColor: color, boxShadow: `0 0 20px ${color}` }
                                    : ['gradient', 'sparkle'].includes(effect.id)
                                        ? { '--border-color': borderColor }
                                        : {},
                                showPicker,
                                color: borderColor,
                                onColorChange: event => setBorderColor(event.target.value)
                            };
                            return (
                                <BorderEffectCard key={effect.id} effect={effect} unlocked={unlocked} isSelected={isSelected}
                                    tooltipPosition={tooltipPosition} previewStyle={previewStyle} onSelect={() => {
                                        if (effect.id === 'solid-picker' && isSelected) setShowColorPicker(!showColorPicker);
                                        else { setSelectedBorder(effect.id); setShowColorPicker(false); }
                                    }} />
                            );
                        })}
                        
                        {/* Achievement-unlocked effects */}
                        {ACHIEVEMENT_EFFECTS.map((effect, index) => {
                            const unlocked = isAchievementEffectUnlocked(effect.achievement);
                            const isSelected = selectedBorder === effect.id;
                            const achievement = ACHIEVEMENTS[effect.achievement];
                            const totalIndex = BORDER_EFFECTS.length + index;
                            const columnIndex = totalIndex % 3;
                            const tooltipPosition = columnIndex === 2 ? 'right-full mr-2' : 'left-full ml-2';
                            return (
                                <BorderEffectCard key={effect.id} effect={effect} unlocked={unlocked} isSelected={isSelected}
                                    tooltipPosition={tooltipPosition} achievement={achievement}
                                    previewStyle={{ className: `border-effect-${effect.id}`, style: {} }}
                                    onSelect={() => { setSelectedBorder(effect.id); setShowColorPicker(false); }} />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CosmeticsDrawer;
