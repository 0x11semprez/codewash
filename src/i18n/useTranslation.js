import { useContext } from 'react';
import { I18nContext } from './I18nContext';

// Returns { t, language, languages, setLanguage }.
export const useTranslation = () => useContext(I18nContext);
