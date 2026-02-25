import { useTranslation } from 'react-i18next';
import { useFirebaseData } from '../hooks/useFirebaseData';

import ProjectCard from '../components/ProjectCard';

const Projects = () => {
  const { t } = useTranslation();
  const { projects, loading } = useFirebaseData();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-primary dark:text-linkDark">{t('projects.title')}</h1>
        <p className="text-base text-linkLight/80 dark:text-linkDark/80">
          {t('projects.description')} {/* TODO: Reemplazar con copy dinámico */}
        </p>
      </header>
      <div className="grid gap-8 md:grid-cols-2">
        {loading ? (
          <p className="text-linkLight/60 dark:text-linkDark/60">Cargando proyectos...</p>
        ) : projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <p className="text-linkLight/60 dark:text-linkDark/60">No hay proyectos disponibles.</p>
        )}
      </div>
    </section>
  );
};

export default Projects;

