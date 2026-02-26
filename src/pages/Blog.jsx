import { useTranslation } from 'react-i18next';
import { FiArrowRight, FiThumbsUp, FiEye } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useFirebaseData } from '../hooks/useFirebaseData';
import { normalizeToSlug } from '../firebase/services/blog';

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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-linkLight/70 dark:text-linkDark/70">
                  {new Date(post.publishedAt).toLocaleDateString()}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-primary dark:text-linkDark">{post.title}</h2>
                <p className="mt-3 text-sm text-linkLight/80 dark:text-linkDark/80">{post.summary || post.metaTitle}</p>
              </div>
              <div className="flex flex-col items-end gap-2 text-xs text-linkLight/60 dark:text-linkDark/60">
                {post.views > 0 && (
                  <div className="flex items-center gap-1">
                    <FiEye size={14} />
                    <span>{post.views}</span>
                  </div>
                )}
                {post.likes > 0 && (
                  <div className="flex items-center gap-1">
                    <FiThumbsUp size={14} />
                    <span>{post.likes}</span>
                  </div>
                )}
              </div>
            </div>
            <Link
              to={`/${normalizeToSlug(post.title)}`}
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight transition-colors duration-200 hover:text-accent dark:text-linkDark dark:hover:text-primary"
            >
              Leer más
              <FiArrowRight size={16} />
            </Link>
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

