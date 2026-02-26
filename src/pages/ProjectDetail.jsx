import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiExternalLink, FiGithub, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getProjectBySlug, normalizeToSlug } from '../firebase/services/projects';

// Rutas que no deben ser capturadas por la ruta dinámica
const EXCLUDED_ROUTES = ['about', 'projects', 'services', 'blog', 'contact', 'admin'];

const ProjectDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.language || 'es';
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si el slug es una ruta excluida, redirigir
    if (slug && EXCLUDED_ROUTES.includes(slug.toLowerCase())) {
      navigate(`/${slug}`);
      return;
    }

    const loadProject = async () => {
      if (!slug) {
        navigate('/');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const result = await getProjectBySlug(slug, language);
        
        if (result.success && result.data) {
          setProject(result.data);
        } else {
          setError(result.error || 'Proyecto no encontrado');
          // Si no se encuentra el proyecto, redirigir después de 2 segundos
          setTimeout(() => {
            navigate('/projects');
          }, 2000);
        }
      } catch (err) {
        setError('Error al cargar el proyecto');
        setTimeout(() => {
          navigate('/projects');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [slug, language, navigate]);

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center py-20">
        <p className="text-linkLight/80 dark:text-linkDark/80">{t('projects.detail.loading')}</p>
      </div>
    );
  }

  if (error || (!loading && !project)) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 py-20">
        <p className="text-linkLight/80 dark:text-linkDark/80">{error || t('projects.detail.notFound')}</p>
        <p className="text-sm text-linkLight/60 dark:text-linkDark/60">{t('projects.detail.redirecting')}</p>
        <Link
          to="/projects"
          className="btn-gradient inline-flex items-center gap-2 text-xs uppercase"
        >
          <FiArrowLeft size={16} />
          {t('projects.detail.backToProjects')}
        </Link>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  // El título NO se traduce, siempre se usa el mismo valor
  const localizedTitle = project.title;
  const localizedDescription = project.i18nKey ? t(`${project.i18nKey}.description`, project.description) : project.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-8"
    >
      {/* Header con logo, nombre y descripción breve */}
      <header className="flex flex-col gap-6">
        <Link
          to="/projects"
          className="inline-flex w-fit items-center gap-2 text-sm text-linkLight/60 transition-colors duration-200 hover:text-accent dark:text-linkDark/60 dark:hover:text-primary"
        >
          <FiArrowLeft size={16} />
          {t('projects.detail.backToProjects')}
        </Link>

        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {project.image && (
            <div className="flex-shrink-0">
              <img
                src={project.image}
                alt={localizedTitle}
                className="h-32 w-100% rounded-2xl object-cover shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-semibold text-primary dark:text-linkDark">{localizedTitle}</h1>
            <div 
              className="mt-2 text-lg text-linkLight/80 dark:text-linkDark/80 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline"
              dangerouslySetInnerHTML={{ __html: localizedDescription }}
            />
            {project.liveUrl && (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-gradient mt-4 inline-flex items-center gap-2 text-xs uppercase"
              >
                <FiExternalLink size={16} />
                {t(project.liveLabel)}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Historia breve */}
      {project.shortHistory && (
        <section className="rounded-2xl border border-primary/10 bg-white/50 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
          <h2 className="mb-4 text-2xl font-semibold text-primary dark:text-linkDark">{t('projects.detail.history')}</h2>
          <div 
            className="text-linkLight/80 dark:text-linkDark/80 prose prose-sm max-w-none dark:prose-invert [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline"
            style={{ 
              '--tw-prose-body': 'inherit',
            }}
            dangerouslySetInnerHTML={{ __html: project.shortHistory || '' }}
          />
        </section>
      )}

      {/* Descripción extendida */}
      {project.extendedDescription && (() => {
        // Dividir por doble salto de línea (párrafos), preservando saltos simples dentro de cada párrafo
        const text = project.extendedDescription || '';
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        
        return (
          <section className="rounded-2xl border border-primary/10 bg-white/50 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
            <h2 className="mb-4 text-2xl font-semibold text-primary dark:text-linkDark">{t('projects.detail.description')}</h2>
            <div className="space-y-4 text-linkLight/80 dark:text-linkDark/80 project-description">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph, index) => {
                  // Dividir por saltos simples y renderizar cada línea con interlineado reducido
                  const lines = paragraph.split('\n').filter(l => l.trim() || l === '');
                  return (
                    <div key={index} className="project-paragraph">
                      {lines.map((line, lineIndex) => (
                        <div key={lineIndex} className="project-line">
                          {line || '\u00A0'}
                        </div>
                      ))}
                    </div>
                  );
                })
              ) : (
                <div className="project-paragraph">
                  {text.split('\n').filter(l => l.trim() || l === '').map((line, lineIndex) => (
                    <div key={lineIndex} className="project-line">
                      {line || '\u00A0'}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* Tech Stack */}
      {project.techStack && project.techStack.length > 0 && (
        <section className="rounded-2xl border border-primary/10 bg-white/50 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
          <h2 className="mb-4 text-2xl font-semibold text-primary dark:text-linkDark">{t('projects.detail.technologies')}</h2>
          <ul className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-primary/20 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-linkLight/70 dark:border-primary/30 dark:text-linkDark/70"
              >
                {t(`projects.tags.${tech}`, tech)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-4">
        {project.liveUrl && (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-gradient inline-flex items-center gap-2 text-xs uppercase"
          >
            <FiExternalLink size={16} />
            {t(project.liveLabel)}
          </a>
        )}
        {project.repositoryUrl && (
          <a
            href={project.repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark dark:hover:text-primary"
          >
            <FiGithub size={16} />
            {project.repositoryLabel || 'GitHub'}
          </a>
        )}
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-white/80 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark dark:hover:text-primary"
        >
          {t('projects.detail.haveQuestion')}
        </Link>
      </div>
    </motion.div>
  );
};

export default ProjectDetail;
