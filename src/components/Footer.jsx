import { useTranslation } from 'react-i18next';
import { Bot, Languages } from 'lucide-react';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const isEnglish = i18n.language === 'en';

  return (
    <footer className="border-t border-primary/10 bg-lightBg/80 px-4 py-6 text-sm text-linkLight transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex flex-col gap-2 text-center sm:text-left">
          <p>{t('footer.copy')}</p>
          {isEnglish && (
            <p className="flex items-center justify-center gap-2 text-xs text-linkLight/60 dark:text-linkDark/60 sm:justify-start">
              <Bot size={14} />
              Automated translation with Google Translate API
              <Languages size={14} />
            </p>
          )}
        </div>
        <p className="text-center text-xs uppercase tracking-widest text-linkLight/80 dark:text-linkDark/70">
          © {new Date().getFullYear()} · Portfolio
        </p>
      </div>
    </footer>
  );
};

export default Footer;

