import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, Languages } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { playClick } from '../../services/soundManager';

// Language button of the main screen, bottom left. It opens a short list of
// the languages found in src/i18n/locales. The settings drawer keeps its own
// LanguageSelector. Escape or a click outside closes the list.
const LanguageMenuButton = () => {
    const { t, language, languages, setLanguage } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const listId = useId();
    const rootRef = useRef(null);
    const toggleRef = useRef(null);
    const selectedRef = useRef(null);
    const current = languages.find((entry) => entry.code === language) || languages[0];

    useEffect(() => {
        if (!isOpen) return undefined;
        // Move focus to the current language so the keyboard starts there.
        selectedRef.current?.focus();
        const closeOnOutsideClick = (event) => {
            if (!rootRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('pointerdown', closeOnOutsideClick);
        return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
    }, [isOpen]);

    const close = () => {
        setIsOpen(false);
        toggleRef.current.focus();
    };

    const choose = (code) => {
        setLanguage(code);
        close();
        playClick();
    };

    const onKeyDown = (event) => {
        if (event.key === 'Escape' && isOpen) {
            event.stopPropagation();
            close();
        }
    };

    return (
        <div ref={rootRef} className="absolute z-40" style={{ bottom: '24px', left: '24px' }} onKeyDown={onKeyDown}>
            {isOpen && (
                <ul
                    id={listId}
                    aria-label={t('language.listLabel')}
                    className="absolute bottom-full left-0 mb-3 flex flex-col gap-2 min-w-48 bg-stone-900/95 p-3 rounded-lg border-2 border-stone-600 shadow-lg"
                >
                    {languages.map(({ code, name }) => {
                        const selected = code === language;
                        return (
                            <li key={code}>
                                <button
                                    type="button"
                                    lang={code}
                                    ref={selected ? selectedRef : undefined}
                                    aria-pressed={selected}
                                    onClick={() => choose(code)}
                                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border-2 font-bold text-lg transition-all ${
                                        selected
                                            ? 'bg-yellow-900/30 border-yellow-400 text-yellow-400'
                                            : 'bg-stone-800/90 border-stone-600 text-slate-200 hover:bg-stone-700'
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
            <button
                ref={toggleRef}
                type="button"
                onClick={() => {
                    setIsOpen((open) => !open);
                    playClick();
                }}
                aria-expanded={isOpen}
                aria-controls={listId}
                aria-label={t('app.changeLanguage', { language: current.name })}
                title={t('app.changeLanguage', { language: current.name })}
                className="bg-stone-800/90 text-white p-3 rounded-lg border-2 border-stone-600 hover:bg-stone-700 transition-all shadow-lg"
            >
                <Languages size={48} className="text-blue-300" aria-hidden="true" />
            </button>
        </div>
    );
};

export default LanguageMenuButton;
