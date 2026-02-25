import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en/translation.json';
import es from './locales/es/translation.json';

const STORAGE_KEY = 'portfolio-language';

const detectInitialLanguage = () => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  return localStorage.getItem(STORAGE_KEY) ?? 'en';
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
    },
    lng: detectInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });
}

export default i18n;

