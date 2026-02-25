import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-primary/10 bg-lightBg/80 px-4 py-6 text-sm text-linkLight transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-center sm:text-left">{t('footer.copy')}</p>
        <p className="text-center text-xs uppercase tracking-widest text-linkLight/80 dark:text-linkDark/70">
          © {new Date().getFullYear()} · Portfolio
        </p>
      </div>
    </footer>
  );
};

export default Footer;

