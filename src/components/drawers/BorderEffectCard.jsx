import React from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';

// The tooltip opens to the left on the last column of the 3-column grid, so it stays on screen.
const tooltipSide = (gridIndex) => (gridIndex % 3 === 2 ? 'right-full mr-2' : 'left-full ml-2');

// One card of the border effect grid in the cosmetics drawer.
// Badge effects and achievement effects share this layout. Only the preview style,
// the extra content under the name (the color picker) and the tooltip differ.
const BorderEffectCard = ({
    effect,
    unlocked,
    isSelected,
    onClick,
    gridIndex,
    previewClassName,
    previewStyle,
    extra,
    tooltip,
    tooltipWidth,
}) => {
    const { t } = useTranslation();
    const IconComponent = effect.icon;

    return (
        <div className="relative group">
            <button
                onClick={onClick}
                disabled={!unlocked}
                className={`relative p-3 rounded-lg border-2 transition-all duration-300 w-full ${
                    !unlocked
                        ? 'bg-slate-800/50 border-slate-600 opacity-70 cursor-not-allowed'
                        : isSelected
                          ? 'bg-yellow-900/30 border-yellow-400 ring-2 ring-yellow-400/20'
                          : 'bg-slate-800/70 border-slate-600 hover:border-yellow-400/50 hover:scale-105'
                }`}
            >
                <div className="flex flex-col gap-2 items-center">
                    <div className="flex items-center justify-center gap-2">
                        <div
                            className={`w-24 h-24 rounded border-4 flex items-center justify-center ${previewClassName}`}
                            style={previewStyle}
                        >
                            <IconComponent size={32} className={!unlocked ? 'text-slate-600' : 'text-slate-300'} />
                        </div>
                        {!unlocked && <Info size={16} className="text-slate-500" />}
                    </div>
                    <div className="text-center">
                        <div className={`text-sm font-bold ${!unlocked ? 'text-slate-500' : 'text-yellow-400'}`}>
                            {t(`borders.${effect.id}.name`)}
                        </div>
                        <div className={`text-xs ${!unlocked ? 'text-slate-600' : 'text-slate-400'}`}>
                            {t(`borders.${effect.id}.description`)}
                        </div>
                    </div>
                    {isSelected && (
                        <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {t('cosmetics.active')}
                        </div>
                    )}
                    {extra}
                </div>
            </button>
            {tooltip && (
                <div
                    className={`absolute z-50 ${tooltipSide(gridIndex)} top-0 ${tooltipWidth} bg-slate-900 border-2 border-yellow-400 rounded-lg shadow-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-200 pointer-events-none`}
                >
                    {tooltip}
                </div>
            )}
        </div>
    );
};

export default BorderEffectCard;
