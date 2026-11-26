import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { I18nContext, devMissingKeyWarner } from './I18nContext';
import { LANGUAGES, LANGUAGE_STORAGE_KEY, LOCALES, getInitialLanguage } from './locales';
import { createTranslator } from './translate';
import { writeJSON } from '../services/storage';

const I18nProvider = ({ children, initialLanguage }) => {
    const [language, setLanguageState] = useState(() =>
        initialLanguage && LOCALES[initialLanguage] ? initialLanguage : getInitialLanguage(),
    );

    const setLanguage = useCallback((code) => {
        if (!LOCALES[code]) return;
        setLanguageState(code);
        writeJSON(LANGUAGE_STORAGE_KEY, code);
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const value = useMemo(
        () => ({
            language,
            languages: LANGUAGES,
            setLanguage,
            t: createTranslator(language, LOCALES, { onMissing: devMissingKeyWarner }),
        }),
        [language, setLanguage],
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export default I18nProvider;
