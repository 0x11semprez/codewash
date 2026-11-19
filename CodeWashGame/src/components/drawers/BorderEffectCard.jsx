import React from 'react';
import { Lock } from 'lucide-react';

const BorderEffectCard = ({
    effect,
    achievement,
    unlocked,
    isSelected,
    tooltipPosition,
    previewClassName,
    previewStyle,
    showColorPicker,
    borderColor,
    onColorChange,
    onSelect
}) => {
    const Icon = effect.icon;
    const tooltipId = `border-effect-${effect.id}-tooltip`;
    const unlockLabel = effect.achievement
        ? achievement?.name || achievement?.title || effect.achievement
        : effect.badge;
    const cardStyle = isSelected
        ? 'border-yellow-400 ring-2 ring-yellow-400/20'
        : 'border-slate-600 enabled:hover:border-white';

    return (
        <div className="group relative min-w-0 hover:z-10 focus-within:z-10">
            <button
                type="button"
                onClick={onSelect}
                disabled={!unlocked}
                aria-pressed={isSelected}
                aria-describedby={tooltipId}
                className={`flex h-full min-h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 bg-slate-900 p-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${cardStyle}`}
            >
                <span
                    aria-hidden="true"
                    className={`relative flex size-10 items-center justify-center rounded-md border-2 border-slate-500 ${previewClassName}`}
                    style={previewStyle}
                >
                    <Icon size={20} />
                </span>
                <span className="flex items-center gap-1 text-xs font-bold">
                    {!unlocked && <Lock size={12} aria-label="Locked" />}
                    {effect.name}
                </span>
            </button>

            <div
                id={tooltipId}
                role="tooltip"
                className={`pointer-events-none absolute top-1/2 z-20 w-40 -translate-y-1/2 rounded-md border border-slate-600 bg-slate-950 p-2 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${tooltipPosition}`}
            >
                <p className="font-bold text-yellow-400">{effect.name}</p>
                <p>{effect.description}</p>
                {unlockLabel && (
                    <p className="mt-1 text-slate-300">
                        {effect.achievement ? 'Achievement' : 'Badge'}: {unlockLabel}
                    </p>
                )}
            </div>

            {unlocked && showColorPicker && (
                <label className="absolute bottom-1 right-1 rounded bg-slate-900 p-0.5">
                    <span className="sr-only">Border color</span>
                    <input
                        type="color"
                        value={borderColor}
                        onChange={event => onColorChange(event.target.value)}
                        className="block h-5 w-6 cursor-pointer"
                    />
                </label>
            )}
        </div>
    );
};

export default BorderEffectCard;
