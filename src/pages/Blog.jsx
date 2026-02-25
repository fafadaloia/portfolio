import { useTranslation } from 'react-i18next';
import { FiArrowRight } from 'react-icons/fi';
import { useFirebaseData } from '../hooks/useFirebaseData';

const Blog = () => {
  const { t } = useTranslation();
  const { blogPosts, loading } = useFirebaseData();

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-primary dark:text-linkDark">{t('blog.title')}</h1>
        <p className="text-base text-linkLight/80 dark:text-linkDark/80">
          {t('blog.description')} {/* TODO: Reemplazar con descripción desde CMS */}
        </p>
      </header>
      <div className="grid gap-6">
        {loading ? (
          <p className="text-linkLight/60 dark:text-linkDark/60">Cargando artículos...</p>
        ) : blogPosts.length > 0 ? (
          blogPosts.map((post) => (
          <article
            key={post.id}
            className="rounded-2xl border border-primary/10 bg-white/50 p-6 transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60"
          >
            <p className="text-xs uppercase tracking-widest text-linkLight/70 dark:text-linkDark/70">
              {new Date(post.publishedAt).toLocaleDateString()}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-primary dark:text-linkDark">{post.title}</h2>
            <p className="mt-3 text-sm text-linkLight/80 dark:text-linkDark/80">{post.summary || post.metaTitle}</p>
            {/* TODO: Sustituir por enlaces reales cuando exista backend */}
            <a
              href="#"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight transition-colors duration-200 hover:text-accent dark:text-linkDark dark:hover:text-primary"
            >
              Leer más
              <FiArrowRight size={16} />
            </a>
          </article>
          ))
        ) : (
          <p className="text-linkLight/60 dark:text-linkDark/60">No hay artículos disponibles.</p>
        )}
      </div>
    </section>
  );
};

export default Blog;

