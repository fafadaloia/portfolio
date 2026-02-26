import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiArrowRight, FiThumbsUp, FiEye } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { normalizeToSlug } from '../firebase/services/blog';

import ProjectCard from '../components/ProjectCard';
import ServiceCard from '../components/ServiceCard';
import TechCarousel from '../components/TechCarousel';
import TestimonialCard from '../components/TestimonialCard';
import services from '../data/services';
import { useFirebaseData } from '../hooks/useFirebaseData';

const Home = () => {
  const { t } = useTranslation();
  const { texts, projects, testimonials, blogPosts, loading } = useFirebaseData();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-20">
      <section className="space-y-6">
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl font-semibold text-primary dark:text-linkDark sm:text-5xl"
        >
          {t('hero.title')}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="max-w-xl text-base leading-relaxed text-linkLight/80 dark:text-linkDark/80"
        >
          {t('hero.subtitle')}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <a href="#projects" className="btn-gradient">
            {t('hero.cta')}
            <FiArrowRight size={18} />
          </a>
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <TechCarousel />
      </motion.div>

      <section className="space-y-4 rounded-2xl border border-primary/10 bg-white/50 p-6 text-base leading-relaxed text-linkLight/80 transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60 dark:text-linkDark/80">
        <Link
          to="/about"
          className="inline-flex items-center text-2xl font-semibold text-primary transition-colors duration-200 hover:text-accent dark:text-linkDark dark:hover:text-primary"
        >
          {t('about.title')}
        </Link>
        <p>{texts.homeAboutMe || t('hero.about')}</p>
      </section>

      <section id="projects" className="space-y-10">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">{t('projects.title')}</h2>
          <p className="max-w-2xl text-sm text-linkLight/80 dark:text-linkDark/80">{t('projects.description')}</p>
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

      <section id="services" className="space-y-10">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">{t('services.title')}</h2>
          <p className="max-w-2xl text-sm text-linkLight/80 dark:text-linkDark/80">{t('services.description')}</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>
      </section>

      <section id="testimonials" className="space-y-10">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">{t('testimonials.title')}</h2>
          <p className="max-w-2xl text-sm text-linkLight/80 dark:text-linkDark/80">{t('testimonials.description')}</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          {loading ? (
            <p className="text-linkLight/60 dark:text-linkDark/60">Cargando testimonios...</p>
          ) : testimonials.length > 0 ? (
            testimonials
              .filter((testimonial) => testimonial.id) // Filtrar testimonios sin ID
              .map((testimonial, index) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
              ))
          ) : (
            <p className="text-linkLight/60 dark:text-linkDark/60">No hay testimonios disponibles.</p>
          )}
        </div>
      </section>

      <section id="blog" className="space-y-10">
        <header className="space-y-2">
          <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">{t('blog.title')}</h2>
          <p className="max-w-2xl text-sm text-linkLight/80 dark:text-linkDark/80">{t('blog.description')}</p>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
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
                  <h3 className="mt-2 text-lg font-semibold text-primary dark:text-linkDark">{post.title}</h3>
                  <p className="mt-3 text-sm text-linkLight/80 dark:text-linkDark/80">{post.summary}</p>
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
    </div>
  );
};

export default Home;

