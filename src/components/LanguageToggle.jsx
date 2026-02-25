import { useContext } from 'react';

import LanguageContext from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

const LanguageToggle = ({ variant = 'default' }) => {
  const { language, toggleLanguage } = useContext(LanguageContext);
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`rounded-full border border-primary/20 px-3 py-1 text-sm font-semibold uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-linkDark/30 dark:text-linkDark dark:hover:text-primary ${
        variant === 'mobile' ? 'w-full border-none px-4 py-3 text-center text-base' : ''
      }`}
    >
      {language === 'es' ? t('language.en') : t('language.es')}
    </button>
  );
};

export default LanguageToggle;

