import { useTranslation } from 'react-i18next';
import { useFirebaseData } from '../hooks/useFirebaseData';

const About = () => {
  const { t } = useTranslation();
  const { texts, loading } = useFirebaseData();
  const fallbackParagraphs = t('about.body', { returnObjects: true });
  
  // Usar datos de Firebase si están disponibles, sino usar traducciones
  const aboutMeText = texts.aboutMe || '';
  const paragraphs = aboutMeText 
    ? aboutMeText.split('\n\n').filter(p => p.trim())
    : (Array.isArray(fallbackParagraphs) ? fallbackParagraphs : [fallbackParagraphs]);

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-semibold text-primary dark:text-linkDark">{t('about.title')}</h1>
        <p className="mt-2 text-base text-linkLight/80 dark:text-linkDark/80">{t('about.description')}</p>
      </header>
      <div className="space-y-4 rounded-2xl border border-primary/10 bg-white/50 p-6 leading-relaxed text-linkLight/80 transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60 dark:text-linkDark/80">
        {loading ? (
          <p className="text-linkLight/60 dark:text-linkDark/60">Cargando contenido...</p>
        ) : paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
        ) : (
          <p>{t('about.body', { returnObjects: true })}</p>
        )}
      </div>
    </section>
  );
};

export default About;
