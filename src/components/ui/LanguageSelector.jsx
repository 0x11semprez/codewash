import React, { useId, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { playClick } from '../../services/soundManager';

// Language button + list of languages. The list comes from the dictionaries
// found in src/i18n/locales, so a new language shows up here on its own.
// Each language is written in its own language ("Français", not "French").
const LanguageSelector = () => {
    const { t, language, languages, setLanguage } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const listId = useId();
    const current = languages.find((entry) => entry.code === language) || languages[0];

    const choose = (code) => {
        setLanguage(code);
        setIsOpen(false);
        playClick();
    };

    return (
        <div>
            <button
                type="button"
                onClick={() => {
                    setIsOpen((open) => !open);
                    playClick();
                }}
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-label={t('language.button', { language: current?.name })}
                className="w-full flex items-center justify-between gap-3 bg-stone-800/90 hover:bg-stone-700 text-white p-3 rounded-lg border-2 border-stone-600 shadow-lg transition-all font-bold text-lg uppercase tracking-wider"
            >
                <span className="flex items-center gap-3">
                    <Languages size={20} className="text-blue-300" aria-hidden="true" />
                    <span lang={current?.code}>{current?.name}</span>
                </span>
                <ChevronDown
                    size={20}
                    aria-hidden="true"
                    className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <ul
                    id={listId}
                    aria-label={t('language.listLabel')}
                    className="mt-2 flex flex-col gap-2 bg-slate-900/50 p-3 rounded-xl border-2 border-slate-600"
                >
                    {languages.map(({ code, name }) => {
                        const selected = code === language;
                        return (
                            <li key={code}>
                                <button
                                    type="button"
                                    lang={code}
                                    aria-pressed={selected}
                                    onClick={() => choose(code)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 font-bold text-lg transition-all ${
                                        selected
                                            ? 'bg-yellow-900/30 border-yellow-400 text-yellow-400'
                                            : 'bg-stone-800/70 border-stone-600 text-slate-200 hover:border-yellow-400/50'
                                    }`}
                                >
                                    <span>{name}</span>
                                    {selected && <Check size={20} aria-hidden="true" />}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default LanguageSelector;
