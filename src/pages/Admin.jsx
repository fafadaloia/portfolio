import { useMemo, useState } from 'react';
import {
  FiEdit3,
  FiMessageSquare,
  FiPlus,
  FiRotateCcw,
  FiSend,
  FiStar,
  FiTrash2,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

import blogPosts from '../data/blog';
import messages from '../data/messages';
import testimonialsData from '../data/testimonials';

const TABS = [
  { key: 'overview', label: 'Inicio' },
  { key: 'testimonials', label: 'Testimonios' },
  { key: 'blog', label: 'Blog' },
  { key: 'messages', label: 'Mensajes' },
];

const emptyTestimonial = { name: '', role: '', quote: '' };
const emptyArticle = { title: '', summary: '', content: '', status: 'draft' };
const MAX_FEATURED = 2;
const MAX_FEATURED_ARTICLES = 2;

const Admin = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [showArticleForm, setShowArticleForm] = useState(false);

  const [testimonials, setTestimonials] = useState(testimonialsData);
  const [testimonialForm, setTestimonialForm] = useState(emptyTestimonial);
  const [editingTestimonialId, setEditingTestimonialId] = useState(null);

  const initialArticles = useMemo(
    () =>
      blogPosts.map((post, index) => ({
        id: post.id,
        title: post.title,
        summary: post.summary,
        content: post.summary,
        readingTime: post.readingTime,
        slug: post.slug,
        publishedAt: post.publishedAt,
        status: 'published',
        views: post.views ?? (index + 1) * 350,
        likes: post.likes ?? (index + 1) * 48,
        featured: index < 2,
      })),
    []
  );

  const [articles, setArticles] = useState(initialArticles);
  const [articleForm, setArticleForm] = useState(emptyArticle);
  const [editingArticleId, setEditingArticleId] = useState(null);

  const formattedMessages = useMemo(
    () =>
      messages.map((message) => ({
        ...message,
        localizedDate: new Date(message.receivedAt).toLocaleString(),
      })),
    []
  );

  const featuredTestimonials = useMemo(
    () => testimonials.filter((testimonial) => testimonial.featured).slice(0, MAX_FEATURED),
    [testimonials]
  );

  const publishedArticles = useMemo(
    () => articles.filter((article) => article.status === 'published'),
    [articles]
  );

  const featuredArticles = useMemo(
    () => publishedArticles.filter((article) => article.featured).slice(0, MAX_FEATURED_ARTICLES),
    [publishedArticles]
  );

  const drafts = useMemo(() => articles.filter((article) => article.status === 'draft'), [articles]);
  const deletedArticles = useMemo(
    () => articles.filter((article) => article.status === 'deleted'),
    [articles]
  );

  const handleTestimonialChange = (event) => {
    const { name, value } = event.target;
    setTestimonialForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestimonialSubmit = (event) => {
    event.preventDefault();
    if (!testimonialForm.name || !testimonialForm.role || !testimonialForm.quote) {
      return;
    }

    if (editingTestimonialId) {
      setTestimonials((prev) =>
        prev.map((testimonial) =>
          testimonial.id === editingTestimonialId
            ? { ...testimonial, ...testimonialForm }
            : testimonial
        )
      );
      setEditingTestimonialId(null);
    } else {
      setTestimonials((prev) => [
        ...prev,
        {
          id: `testimonial-${prev.length + 1}`,
          ...testimonialForm,
          featured: false,
        },
      ]);
    }

    setTestimonialForm(emptyTestimonial);
  };

  const handleEditTestimonial = (testimonial) => {
    setEditingTestimonialId(testimonial.id);
    setTestimonialForm({
      name: t(testimonial.name, testimonial.name),
      role: t(testimonial.role, testimonial.role),
      quote: testimonial.quote,
    });
  };

  const handleCancelTestimonialEdit = () => {
    setEditingTestimonialId(null);
    setTestimonialForm(emptyTestimonial);
  };

  const handleDeleteTestimonial = (id) => {
    setTestimonials((prev) => prev.filter((testimonial) => testimonial.id !== id));
    if (editingTestimonialId === id) {
      handleCancelTestimonialEdit();
    }
  };

  const handleToggleFeatured = (id) => {
    setTestimonials((prev) =>
      prev.map((testimonial) => {
        if (testimonial.id !== id) {
          return testimonial;
        }
        if (testimonial.featured) {
          return { ...testimonial, featured: false };
        }
        const featuredCount = prev.filter((item) => item.featured).length;
        if (featuredCount >= MAX_FEATURED) {
          return testimonial;
        }
        return { ...testimonial, featured: true };
      })
    );
  };

  const handleArticleChange = (event) => {
    const { name, value } = event.target;
    setArticleForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleArticleSubmit = (event) => {
    event.preventDefault();
    if (!articleForm.title || !articleForm.summary || !articleForm.content) {
      return;
    }

    const computedReadingTime = `${Math.max(3, Math.round(articleForm.content.split(' ').length / 200))} min`;
    const normalizedSlug = articleForm.title.trim().toLowerCase().replace(/\s+/g, '-');

    if (editingArticleId) {
      setArticles((prev) =>
        prev.map((article) => {
          if (article.id !== editingArticleId) {
            return article;
          }
          const nextStatus = articleForm.status;
          const isBecomingPublished = nextStatus === 'published' && article.status !== 'published';
          const nextPublishedAt =
            nextStatus === 'published'
              ? isBecomingPublished
                ? new Date().toISOString()
                : article.publishedAt ?? new Date().toISOString()
              : article.publishedAt;

          return {
            ...article,
            title: articleForm.title,
            summary: articleForm.summary,
            content: articleForm.content,
            status: nextStatus,
            slug: normalizedSlug,
            readingTime: computedReadingTime,
            publishedAt: nextPublishedAt,
            featured: nextStatus === 'published' ? article.featured : false,
          };
        })
      );
      setEditingArticleId(null);
    } else {
      const newArticle = {
        id: `article-${articles.length + 1}`,
        title: articleForm.title,
        summary: articleForm.summary,
        content: articleForm.content,
        slug: normalizedSlug,
        status: articleForm.status,
        publishedAt: articleForm.status === 'published' ? new Date().toISOString() : null,
        readingTime: computedReadingTime,
        views: 0,
        likes: 0,
        featured: false,
      };

      setArticles((prev) => [newArticle, ...prev]);
    }

    setArticleForm(emptyArticle);
    setShowArticleForm(false);
  };

  const handlePublishArticle = (id) => {
    setArticles((prev) =>
      prev.map((article) =>
        article.id === id
          ? { ...article, status: 'published', publishedAt: new Date().toISOString() }
          : article
      )
    );
  };

  const handleDeleteArticle = (id) => {
    setArticles((prev) =>
      prev.map((article) => (article.id === id ? { ...article, status: 'deleted' } : article))
    );
  };

  const handleRestoreArticle = (id) => {
    setArticles((prev) =>
      prev.map((article) => (article.id === id ? { ...article, status: 'draft' } : article))
    );
  };

  const handleToggleFeaturedArticle = (id) => {
    setArticles((prev) => {
      const featuredCount = prev.filter((article) => article.featured && article.status === 'published').length;
      return prev.map((article) => {
        if (article.id !== id) {
          return article;
        }
        if (article.featured) {
          return { ...article, featured: false };
        }
        if (featuredCount >= MAX_FEATURED_ARTICLES || article.status !== 'published') {
          return article;
        }
        return { ...article, featured: true };
      });
    });
  };

  const handleEditArticle = (article) => {
    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title,
      summary: article.summary,
      content: article.content,
      status: article.status,
    });
    setShowArticleForm(true);
  };

  const handleCancelArticleEdit = () => {
    setEditingArticleId(null);
    setArticleForm(emptyArticle);
    setShowArticleForm(false);
  };

  const recentPublishedArticles = featuredArticles.slice(0, 2);
  const recentMessages = formattedMessages.slice(0, 2);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold text-primary dark:text-linkDark">Panel de Administración</h1>
        <p className="text-base text-linkLight/80 dark:text-linkDark/80">
          Gestioná testimonios, artículos del blog y mensajes de colaboración desde un solo lugar.
        </p>
      </header>

      <nav className="flex flex-wrap gap-3 rounded-2xl border border-primary/10 bg-white/70 p-4 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/70">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold uppercase tracking-widest transition-colors duration-200 ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-buttonLightFrom to-buttonLightTo text-buttonTextLight dark:from-buttonDarkFrom dark:to-buttonDarkTo dark:text-buttonTextDark'
                : 'text-linkLight/80 hover:text-accent dark:text-linkDark/70 dark:hover:text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' && (
        <section className="space-y-10">
          <article className="rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
            <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Testimonios en portada</h2>
            <p className="mt-1 text-sm text-linkLight/80 dark:text-linkDark/80">
              Estos testimonios se muestran actualmente en la interfaz pública.
            </p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {featuredTestimonials.map((testimonial) => (
                <li
                  key={testimonial.id}
                  className="rounded-xl border border-primary/10 bg-white/80 p-4 text-sm text-linkLight/80 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/80"
                >
                  <p className="font-semibold text-primary dark:text-linkDark">
                    {t(testimonial.name, testimonial.name)}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                    {t(testimonial.role, testimonial.role)}
                  </p>
                  <p className="mt-2 leading-relaxed">"{testimonial.quote}"</p>
                </li>
              ))}
              {featuredTestimonials.length === 0 && (
                <li className="rounded-xl border border-primary/10 bg-white/80 p-4 text-sm text-linkLight/60 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/60">
                  Aún no hay testimonios destacados.
                </li>
              )}
            </ul>
          </article>

          <article className="rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
            <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Artículos destacados</h2>
            <p className="mt-1 text-sm text-linkLight/80 dark:text-linkDark/80">
              Estos artículos se muestran actualmente en el inicio del sitio.
            </p>
            <ul className="mt-4 grid gap-4 md:grid-cols-2">
              {recentPublishedArticles.map((article) => (
                <li
                  key={article.id}
                  className="rounded-xl border border-primary/10 bg-white/80 p-5 text-sm text-linkLight/80 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/80"
                >
                  <p className="font-semibold text-primary dark:text-linkDark">{article.title}</p>
                  <p className="mt-2 text-linkLight/70 dark:text-linkDark/70">{article.summary}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                    <span>{article.views} vistas</span>
                    <span>{article.likes} likes</span>
                    <span>{article.readingTime}</span>
                  </div>
                </li>
              ))}
              {recentPublishedArticles.length === 0 && (
                <li className="rounded-xl border border-primary/10 bg-white/80 p-4 text-sm text-linkLight/60 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/60">
                  Todavía no hay artículos destacados.
                </li>
              )}
            </ul>
          </article>

          <article className="rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
            <header className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-linkDark/10 dark:text-linkDark">
                <FiMessageSquare size={18} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Mensajes recientes</h2>
                <p className="text-sm text-linkLight/80 dark:text-linkDark/80">
                  Últimas solicitudes de colaboración recibidas desde el formulario de contacto.
                </p>
              </div>
            </header>
            <div className="grid gap-4">
              {recentMessages.map((message) => (
                <article
                  key={message.id}
                  className="rounded-xl border border-primary/10 bg-white/80 p-5 text-sm text-linkLight/80 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/80"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                    <span>{message.name}</span>
                    <span>{message.localizedDate}</span>
                  </div>
                  <p className="mt-1 text-xs text-linkLight/70 dark:text-linkDark/70">{message.email}</p>
                  <h3 className="mt-3 text-base font-semibold text-primary dark:text-linkDark">{message.subject}</h3>
                  <p className="mt-2 leading-relaxed">{message.message}</p>
                </article>
              ))}
            </div>
          </article>
        </section>
      )}

      {activeTab === 'testimonials' && (
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="space-y-6 rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
            <header>
              <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">
                {editingTestimonialId ? 'Editar testimonio' : 'Nuevo testimonio'}
              </h2>
              <p className="mt-1 text-sm text-linkLight/80 dark:text-linkDark/80">
                Podés destacar como máximo dos testimonios para mostrarlos en el inicio.
              </p>
            </header>
            <form onSubmit={handleTestimonialSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Nombre
                  <input
                    type="text"
                    name="name"
                    value={testimonialForm.name}
                    onChange={handleTestimonialChange}
                    placeholder="Ej. Fernando"
                    className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Rol
                  <input
                    type="text"
                    name="role"
                    value={testimonialForm.role}
                    onChange={handleTestimonialChange}
                    placeholder="Ej. Director de Latin-data"
                    className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                    required
                  />
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Testimonio
                <textarea
                  name="quote"
                  value={testimonialForm.quote}
                  onChange={handleTestimonialChange}
                  rows={4}
                  placeholder="La colaboración fue impecable..."
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  required
                />
              </label>
              <div className="flex flex-wrap justify-end gap-3">
                {editingTestimonialId && (
                  <button
                    type="button"
                    onClick={handleCancelTestimonialEdit}
                    className="rounded-lg border border-primary/20 px-4 py-2 text-sm uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="btn-gradient text-xs uppercase">
                  <FiSend size={16} />
                  {editingTestimonialId ? 'Actualizar testimonio' : 'Guardar testimonio'}
                </button>
              </div>
            </form>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/70">
                  Testimonios activos
                </h3>
                <span className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                  Favoritos {featuredTestimonials.length}/{MAX_FEATURED}
                </span>
              </div>
              <ul className="space-y-2">
                {testimonials.map((testimonial) => (
                  <li
                    key={testimonial.id}
                    className="rounded-xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-linkLight/80 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/80"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-primary dark:text-linkDark">
                          {t(testimonial.name, testimonial.name)}
                        </p>
                        <p className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                          {t(testimonial.role, testimonial.role)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-widest">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(testimonial.id)}
                          className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors duration-200 ${
                            testimonial.featured
                              ? 'bg-primary/10 text-primary dark:bg-linkDark/10 dark:text-linkDark'
                              : 'border border-primary/20 text-linkLight hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary'
                          }`}
                        >
                          <FiStar size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditTestimonial(testimonial)}
                          className="flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                        >
                          <FiEdit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTestimonial(testimonial.id)}
                          className="flex items-center gap-1 rounded-full border border-red-300 px-3 py-1 text-red-500 transition-colors duration-200 hover:border-red-500 hover:text-red-600 dark:border-red-500/50 dark:text-red-400"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-linkLight/80 dark:text-linkDark/70">"{testimonial.quote}"</p>
                  </li>
                ))}
              </ul>
            </section>
          </article>

          <article className="space-y-6 rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
            <header className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Testimonios destacados</h2>
                <p className="text-sm text-linkLight/80 dark:text-linkDark/80">
                  Los testimonios marcados se mostrarán en la página pública.
                </p>
              </div>
              <span className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                {featuredTestimonials.length}/{MAX_FEATURED}
              </span>
            </header>
            <ul className="space-y-2">
              {featuredTestimonials.map((testimonial) => (
                <li
                  key={testimonial.id}
                  className="rounded-xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-linkLight/80 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/80"
                >
                  <p className="font-semibold text-primary dark:text-linkDark">
                    {t(testimonial.name, testimonial.name)}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                    {t(testimonial.role, testimonial.role)}
                  </p>
                  <p className="mt-2 leading-relaxed">"{testimonial.quote}"</p>
                </li>
              ))}
              {featuredTestimonials.length === 0 && (
                <li className="rounded-xl border border-primary/10 bg-white/80 p-4 text-sm text-linkLight/60 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/60">
                  Todavía no hay testimonios destacados seleccionados.
                </li>
              )}
            </ul>
          </article>
        </section>
      )}

      {activeTab === 'blog' && (
        <section className="space-y-8 rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Gestión de artículos</h2>
              <p className="text-sm text-linkLight/80 dark:text-linkDark/80">
                Creá contenido nuevo o administrá las publicaciones existentes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (showArticleForm && editingArticleId) {
                  handleCancelArticleEdit();
                  return;
                }
                if (showArticleForm) {
                  setShowArticleForm(false);
                  setArticleForm(emptyArticle);
                  setEditingArticleId(null);
                } else {
                  setEditingArticleId(null);
                  setArticleForm(emptyArticle);
                  setShowArticleForm(true);
                }
              }}
              className="btn-gradient inline-flex items-center gap-2 text-xs uppercase"
            >
              <FiPlus size={16} />
              {showArticleForm ? (editingArticleId ? 'Cancelar edición' : 'Cerrar formulario') : 'Nuevo artículo'}
            </button>
          </header>

          {showArticleForm && (
            <form onSubmit={handleArticleSubmit} className="grid gap-4 rounded-2xl border border-primary/10 bg-white/80 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/70">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Título
                  <input
                    type="text"
                    name="title"
                    value={articleForm.title}
                    onChange={handleArticleChange}
                    placeholder="Ej. Automatización inteligente con React"
                    className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                    required
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Estado
                  <select
                    name="status"
                    value={articleForm.status}
                    onChange={handleArticleChange}
                    className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  >
                    <option value="draft">Guardar como borrador</option>
                    <option value="published">Publicar ahora</option>
                  </select>
                </label>
              </div>
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Descripción breve (para el inicio)
                <textarea
                  name="summary"
                  value={articleForm.summary}
                  onChange={handleArticleChange}
                  rows={4}
                  placeholder="Escribí un resumen atractivo..."
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  required
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Artículo (podés incluir enlaces con &lt;href="https://tu-link"&gt;&lt;/href&gt;)
                <textarea
                  name="content"
                  value={articleForm.content}
                  onChange={handleArticleChange}
                  rows={10}
                  placeholder="Desarrollo completo del artículo..."
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  required
                />
              </label>
              <div className="flex justify-end gap-3">
                {editingArticleId && (
                  <button
                    type="button"
                    onClick={handleCancelArticleEdit}
                    className="rounded-lg border border-primary/20 px-4 py-2 text-xs uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                  >
                    Cancelar
                  </button>
                )}
                <button type="submit" className="btn-gradient inline-flex items-center gap-2 text-xs uppercase">
                  <FiSend size={16} />
                  {editingArticleId ? 'Actualizar artículo' : 'Guardar artículo'}
                </button>
              </div>
            </form>
          )}

          <section className="space-y-4">
            <header className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-primary dark:text-linkDark">Publicados</h3>
              <span className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                Destacados {featuredArticles.length}/{MAX_FEATURED_ARTICLES}
              </span>
            </header>
            <ul className="grid gap-4 md:grid-cols-2">
              {publishedArticles.map((article) => (
                <li
                  key={article.id}
                  className="rounded-2xl border border-primary/10 bg-white/80 p-5 text-sm text-linkLight/80 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/80"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-primary dark:text-linkDark">{article.title}</p>
                      <p className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                        Publicado el {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                      <button
                        type="button"
                        onClick={() => handleToggleFeaturedArticle(article.id)}
                        className={`flex items-center gap-1 rounded-full px-3 py-1 transition-colors duration-200 ${
                          article.featured
                            ? 'bg-primary/10 text-primary dark:bg-linkDark/10 dark:text-linkDark'
                            : 'border border-primary/20 text-linkLight hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary'
                        }`}
                      >
                        <FiStar size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditArticle(article)}
                        className="flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                      >
                        <FiEdit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(article.id)}
                        className="flex items-center gap-1 rounded-full border border-red-300 px-3 py-1 text-red-500 transition-colors duration-200 hover:border-red-500 hover:text-red-600 dark:border-red-500/50 dark:text-red-400"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 leading-relaxed">{article.summary}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                    <span>{article.views} vistas</span>
                    <span>{article.likes} likes</span>
                    <span>{article.readingTime}</span>
                  </div>
                </li>
              ))}
              {publishedArticles.length === 0 && (
                <li className="rounded-xl border border-primary/10 bg-white/80 p-4 text-sm text-linkLight/60 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/60">
                  No hay artículos publicados por el momento.
                </li>
              )}
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-primary dark:text-linkDark">Borradores</h3>
            <ul className="grid gap-4 md:grid-cols-2">
              {drafts.map((article) => (
                <li
                  key={article.id}
                  className="rounded-2xl border border-primary/10 bg-white/80 p-5 text-sm text-linkLight/80 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/80"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-semibold text-primary dark:text-linkDark">{article.title}</p>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                      <button
                        type="button"
                        onClick={() => handleEditArticle(article)}
                        className="flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                      >
                        <FiEdit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePublishArticle(article.id)}
                        className="flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                      >
                        <FiSend size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(article.id)}
                        className="flex items-center gap-1 rounded-full border border-red-300 px-3 py-1 text-red-500 transition-colors duration-200 hover:border-red-500 hover:text-red-600 dark:border-red-500/50 dark:text-red-400"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 leading-relaxed">{article.summary}</p>
                </li>
              ))}
              {drafts.length === 0 && (
                <li className="rounded-xl border border-primary/10 bg-white/80 p-4 text-sm text-linkLight/60 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/60">
                  No hay borradores pendientes.
                </li>
              )}
            </ul>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-semibold text-primary dark:text-linkDark">Eliminados</h3>
            <ul className="grid gap-4 md:grid-cols-2">
              {deletedArticles.map((article) => (
                <li
                  key={article.id}
                  className="rounded-2xl border border-primary/10 bg-white/80 p-5 text-sm text-linkLight/80 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/80"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-semibold text-primary dark:text-linkDark">{article.title}</p>
                    <button
                      type="button"
                      onClick={() => handleRestoreArticle(article.id)}
                      className="flex items-center gap-1 rounded-full border border-primary/20 px-3 py-1 text-xs uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                    >
                      <FiRotateCcw size={14} />
                    </button>
                  </div>
                  <p className="mt-3 leading-relaxed">{article.summary}</p>
                </li>
              ))}
              {deletedArticles.length === 0 && (
                <li className="rounded-xl border border-primary/10 bg-white/80 p-4 text-sm text-linkLight/60 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/60">
                  No hay artículos eliminados.
                </li>
              )}
            </ul>
          </section>
        </section>
      )}

      {activeTab === 'messages' && (
        <section className="rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
          <header className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-linkDark/10 dark:text-linkDark">
              <FiMessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Mensajes de colaboración</h2>
              <p className="text-sm text-linkLight/80 dark:text-linkDark/80">
                Vista rápida de solicitudes de colaboración recibidas mediante el formulario de contacto.
              </p>
            </div>
          </header>

          <div className="grid gap-4">
            {formattedMessages.map((message) => (
              <article
                key={message.id}
                className="rounded-xl border border-primary/10 bg-white/80 p-5 text-sm text-linkLight/80 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70 dark:text-linkDark/80"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                  <span>{message.name}</span>
                  <span>{message.localizedDate}</span>
                </div>
                <p className="mt-1 text-xs text-linkLight/70 dark:text-linkDark/70">{message.email}</p>
                <h3 className="mt-3 text-base font-semibold text-primary dark:text-linkDark">{message.subject}</h3>
                <p className="mt-2 leading-relaxed">{message.message}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Admin;

