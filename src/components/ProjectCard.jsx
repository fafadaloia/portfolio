import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiExternalLink, FiGithub, FiLock } from 'react-icons/fi';

const ProjectCard = ({ project }) => {
  const { t } = useTranslation();
  const {
    title,
    description,
    techStack,
    liveUrl,
    liveLabel = 'Live',
    repositoryUrl,
    repositoryLabel = 'Código',
    image,
    i18nKey,
  } = project;

  const isRepositoryPrivate = !repositoryUrl;
  const FALLBACK_IMAGE = '/images/proyectos/placeholder.svg';

  const localizedTitle = i18nKey ? t(`${i18nKey}.title`, title) : title;
  const localizedDescription = i18nKey ? t(`${i18nKey}.description`, description) : description;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white/50 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60"
    >
      <div className="relative h-48 w-full overflow-hidden bg-secondary/10">
        {image ? (
          <img
            src={image}
            alt={localizedTitle}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            onError={(event) => {
              if (event.currentTarget.dataset.fallback !== 'true') {
                event.currentTarget.dataset.fallback = 'true';
                event.currentTarget.src = FALLBACK_IMAGE;
              }
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
            {t('projects.labels.imageUnavailable', 'Imagen no disponible')}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div>
          <h3 className="text-lg font-semibold text-primary dark:text-linkDark">{localizedTitle}</h3>
          <p className="mt-2 text-sm text-linkLight/80 dark:text-linkDark/80">{localizedDescription}</p>
        </div>

        <ul className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-widest text-linkLight/70 dark:text-linkDark/70">
          {techStack?.map((tech) => (
            <li key={tech} className="rounded-full border border-primary/20 px-3 py-1">
              {t(`projects.tags.${tech}`, tech)}
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap items-center gap-3">
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-gradient text-xs uppercase">
              <FiExternalLink size={16} />
              {t(liveLabel)}
            </a>
          )}

          {isRepositoryPrivate ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-linkLight/70 dark:border-primary/30 dark:text-linkDark/70">
              <FiLock size={16} />
              {repositoryLabel}
            </div>
          ) : (
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-linkLight transition-colors duration-200 hover:text-accent dark:text-linkDark dark:hover:text-primary"
            >
              <FiGithub size={16} />
              {repositoryLabel}
            </a>
          )}
        </div>
      </div>
    </motion.article>
  );
};

export default ProjectCard;

