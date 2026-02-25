import { createContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
});

const STORAGE_KEY = 'portfolio-language';

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(() => {
    if (typeof window === 'undefined') {
      return 'en';
    }
    return localStorage.getItem(STORAGE_KEY) ?? 'en';
  });

  useEffect(() => {
    const active = language || i18n.language;
    if (!active) {
      return;
    }

    if (active !== i18n.language) {
      i18n.changeLanguage(active);
    }
  }, [i18n, language]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (value) => {
    setLanguageState(value);
    i18n.changeLanguage(value);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export default LanguageContext;

