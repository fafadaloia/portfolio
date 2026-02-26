import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiThumbsUp, FiEye, FiArrowLeft, FiSend } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { getArticleBySlug, getRecommendedArticles, normalizeToSlug } from '../firebase/services/blog';
import { getArticleComments, createComment } from '../firebase/services/comments';
import { incrementViews, toggleLike, getArticleStats } from '../firebase/services/articleStats';

// Rutas que no deben ser capturadas por la ruta dinámica
const EXCLUDED_ROUTES = ['about', 'projects', 'services', 'blog', 'contact', 'admin'];

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.language || 'es';
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendedArticles, setRecommendedArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [visibleComments, setVisibleComments] = useState(2);
  const [stats, setStats] = useState({ views: 0, likes: 0 });
  const [liked, setLiked] = useState(false);
  const [commentForm, setCommentForm] = useState({
    name: '',
    mail: '',
    comment: '',
  });
  const [submittingComment, setSubmittingComment] = useState(false);
  const contentRef = useRef(null);

  // Función para procesar y arreglar los links en el HTML renderizado
  const processLinksInContent = () => {
    if (!contentRef.current) return;
    
    const links = contentRef.current.querySelectorAll('a');
    links.forEach((link) => {
      // Remover contenteditable si existe
      link.removeAttribute('contenteditable');
      
      // Asegurar que tenga href válido
      let href = link.getAttribute('href') || link.href || '';
      
      // Si no tiene href, intentar obtenerlo del texto
      if (!href) {
        const textContent = link.textContent || link.innerText || '';
        if (textContent.match(/^https?:\/\//)) {
          href = textContent.trim();
          link.setAttribute('href', href);
        }
      }
      
      // Si aún no hay href válido, convertir a texto
      if (!href || href === '#') {
        const textNode = document.createTextNode(link.textContent || link.innerText || '');
        link.parentNode?.replaceChild(textNode, link);
        return;
      }
      
      // Remover spans innecesarios dentro del link
      const spans = link.querySelectorAll('span');
      spans.forEach((span) => {
        // Mover el contenido del span al link
        while (span.firstChild) {
          link.insertBefore(span.firstChild, span);
        }
        span.remove();
      });
      
      // Asegurar target y rel para links externos
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        if (!link.getAttribute('target')) {
          link.setAttribute('target', '_blank');
        }
        if (!link.getAttribute('rel')) {
          link.setAttribute('rel', 'noopener noreferrer');
        }
      }
      
      // Asegurar que sea clickeable
      link.style.cursor = 'pointer';
      link.style.pointerEvents = 'auto';
      link.style.textDecoration = 'underline';
      
      // Agregar onClick como fallback si el href no funciona
      if (!link.onclick) {
        link.addEventListener('click', (e) => {
          if (href && href !== '#') {
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
              window.open(href, '_blank', 'noopener,noreferrer');
            } else {
              window.location.href = href;
            }
          }
        });
      }
    });
  };

  useEffect(() => {
    // Si el slug es una ruta excluida, redirigir
    if (slug && EXCLUDED_ROUTES.includes(slug.toLowerCase())) {
      navigate(`/${slug}`);
      return;
    }

    const loadArticle = async () => {
      if (!slug) {
        navigate('/blog');
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const result = await getArticleBySlug(slug, language);
        
        if (result.success && result.data) {
          setArticle(result.data);
          
          // Cargar estadísticas
          const statsResult = await getArticleStats(result.data.id, language);
          if (statsResult.success) {
            setStats(statsResult.data);
          }
          
          // Incrementar visualizaciones
          await incrementViews(result.data.id, language);
          
          // Cargar recomendaciones basadas en tags
          if (result.data.tags && result.data.tags.length > 0) {
            const recommendedResult = await getRecommendedArticles(
              result.data.id,
              result.data.tags,
              language,
              3
            );
            if (recommendedResult.success) {
              setRecommendedArticles(recommendedResult.data);
            }
          }
          
          // Cargar comentarios
          const commentsResult = await getArticleComments(result.data.id, language);
          if (commentsResult.success) {
            setComments(commentsResult.data);
          }
        } else {
          setError(result.error || 'Artículo no encontrado');
          setTimeout(() => {
            navigate('/blog');
          }, 2000);
        }
      } catch (err) {
        setError('Error al cargar el artículo');
        setTimeout(() => {
          navigate('/blog');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug, language, navigate]);

  // Procesar links después de que el contenido se renderice
  useEffect(() => {
    if (article && contentRef.current) {
      // Pequeño delay para asegurar que el DOM esté actualizado
      setTimeout(() => {
        processLinksInContent();
      }, 100);
    }
  }, [article]);

  const handleLike = async () => {
    if (!article || liked) return;
    
    const result = await toggleLike(article.id, language);
    if (result.success) {
      setStats(prev => ({ ...prev, likes: result.likes }));
      setLiked(true);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!commentForm.name.trim() || !commentForm.comment.trim()) {
      return;
    }
    
    if (!article) return;
    
    setSubmittingComment(true);
    
    try {
      const result = await createComment(article.id, language, {
        name: commentForm.name.trim(),
        mail: commentForm.mail.trim(),
        comment: commentForm.comment.trim(),
      });
      
      if (result.success) {
        // Recargar comentarios
        const commentsResult = await getArticleComments(article.id, language);
        if (commentsResult.success) {
          setComments(commentsResult.data);
        }
        
        // Limpiar formulario
        setCommentForm({ name: '', mail: '', comment: '' });
      }
    } catch (err) {
      // Error al enviar comentario
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-6xl items-center justify-center py-20">
        <p className="text-linkLight/80 dark:text-linkDark/80">Cargando artículo...</p>
      </div>
    );
  }

  if (error || (!loading && !article)) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 py-20">
        <p className="text-linkLight/80 dark:text-linkDark/80">{error || 'Artículo no encontrado'}</p>
        <Link
          to="/blog"
          className="btn-gradient inline-flex items-center gap-2 text-xs uppercase"
        >
          <FiArrowLeft size={16} />
          Volver al blog
        </Link>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  const visibleCommentsList = comments.slice(0, visibleComments);
  const hasMoreComments = comments.length > visibleComments;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-6xl flex-col gap-8"
    >
      {/* Header con botones de like y visualizaciones */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Link
            to="/blog"
            className="mb-4 inline-flex items-center gap-2 text-sm text-linkLight/60 transition-colors hover:text-linkLight dark:text-linkDark/60 dark:hover:text-linkDark"
          >
            <FiArrowLeft size={16} />
            Volver al blog
          </Link>
          
          <h1 className="text-4xl font-semibold text-primary dark:text-linkDark">{article.title}</h1>
          
          {article.summary && (
            <p className="mt-4 text-lg text-linkLight/80 dark:text-linkDark/80">{article.summary}</p>
          )}
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleLike}
            disabled={liked}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors ${
              liked
                ? 'bg-primary/20 text-primary dark:bg-primary/30'
                : 'border border-primary/20 text-linkLight hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary'
            }`}
          >
            <FiThumbsUp size={18} />
            <span>{stats.likes}</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-linkLight/60 dark:text-linkDark/60">
            <FiEye size={18} />
            <span>{stats.views}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag, index) => (
            <span
              key={index}
              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary dark:bg-primary/20 dark:text-linkDark"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Cuerpo del artículo */}
      <div
        ref={contentRef}
        className="prose prose-lg max-w-none dark:prose-invert [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_a]:cursor-pointer [&_a]:underline [&_a]:text-linkLight [&_a:hover]:text-accent dark:[&_a]:text-linkDark dark:[&_a:hover]:text-primary"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Botón de like al final */}
      <div className="flex justify-end">
        <button
          onClick={handleLike}
          disabled={liked}
          className={`flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors ${
            liked
              ? 'bg-primary/20 text-primary dark:bg-primary/30'
              : 'border border-primary/20 text-linkLight hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary'
          }`}
        >
          <FiThumbsUp size={20} />
          <span>{stats.likes}</span>
        </button>
      </div>

      {/* Comentarios */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Comentarios</h2>
        
        {/* Formulario de comentarios */}
        <form onSubmit={handleCommentSubmit} className="space-y-4 rounded-2xl border border-primary/10 bg-white/50 p-6 dark:border-primary/20 dark:bg-darkBg/60">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-linkLight dark:text-linkDark">
                Nombre <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                value={commentForm.name}
                onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                required
                className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-linkLight dark:text-linkDark">Mail</span>
              <input
                type="email"
                value={commentForm.mail}
                onChange={(e) => setCommentForm({ ...commentForm, mail: e.target.value })}
                className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
              />
            </label>
          </div>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-linkLight dark:text-linkDark">
              Comentario <span className="text-red-500">*</span>
            </span>
            <textarea
              value={commentForm.comment}
              onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
              required
              rows={4}
              className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
            />
          </label>
          <button
            type="submit"
            disabled={submittingComment}
            className="btn-gradient inline-flex items-center gap-2 text-xs uppercase"
          >
            <FiSend size={16} />
            {submittingComment ? 'Enviando...' : 'Enviar comentario'}
          </button>
        </form>

        {/* Lista de comentarios */}
        {visibleCommentsList.length > 0 ? (
          <div className="space-y-4">
            {visibleCommentsList.map((comment) => (
              <div
                key={comment.id}
                className="rounded-2xl border border-primary/10 bg-white/50 p-6 dark:border-primary/20 dark:bg-darkBg/60"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary dark:text-linkDark">{comment.name}</h3>
                    {comment.mail && (
                      <p className="mt-1 text-sm text-linkLight/60 dark:text-linkDark/60">{comment.mail}</p>
                    )}
                    <p className="mt-3 text-linkLight/80 dark:text-linkDark/80">{comment.comment}</p>
                  </div>
                  <span className="text-xs text-linkLight/60 dark:text-linkDark/60">
                    {comment.createdAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            
            {hasMoreComments && (
              <button
                onClick={() => setVisibleComments(prev => prev + 2)}
                className="w-full rounded-lg border border-primary/20 px-4 py-2 text-sm text-linkLight transition-colors hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
              >
                Mostrar más
              </button>
            )}
          </div>
        ) : (
          <p className="text-center text-linkLight/60 dark:text-linkDark/60">
            No hay comentarios aún. ¡Sé el primero en comentar!
          </p>
        )}
      </section>

      {/* Recomendaciones */}
      {recommendedArticles.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Te puede interesar</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {recommendedArticles.map((recommended) => (
              <Link
                key={recommended.id}
                to={`/${normalizeToSlug(recommended.title)}`}
                className="group rounded-2xl border border-primary/10 bg-white/50 p-6 transition-colors duration-300 hover:border-primary/20 dark:border-primary/20 dark:bg-darkBg/60"
              >
                <h3 className="text-lg font-semibold text-primary transition-colors group-hover:text-accent dark:text-linkDark dark:group-hover:text-primary">
                  {recommended.title}
                </h3>
                <p className="mt-2 text-sm text-linkLight/80 dark:text-linkDark/80">
                  {recommended.summary || recommended.metaTitle}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-linkLight/60 dark:text-linkDark/60">
                  {recommended.views > 0 && (
                    <span className="flex items-center gap-1">
                      <FiEye size={14} />
                      {recommended.views}
                    </span>
                  )}
                  {recommended.likes > 0 && (
                    <span className="flex items-center gap-1">
                      <FiThumbsUp size={14} />
                      {recommended.likes}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
};

export default ArticleDetail;
