import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit3, FiTrash2, FiSave, FiX, FiCalendar, FiBold, FiItalic, FiUnderline, FiLink, FiImage, FiGlobe } from 'react-icons/fi';
import { getBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost } from '../../firebase/services/blog';
import { translateText, isTranslateAvailable } from '../../services/translate';
import { useModal } from '../hooks/useModal';
import Modal from './Modal';
import Toast from './Toast';

const BlogEditor = () => {
  const [articles, setArticles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    titleEs: '',
    metaTitle: '',
    metaTitleEs: '',
    content: '',
    contentEs: '',
    publishedAt: '',
  });
  const [translating, setTranslating] = useState({});
  const editorRefEs = useRef(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [editingLink, setEditingLink] = useState(null);
  const editorRef = useRef(null);
  const linkDialogRef = useRef(null);
  const imageDialogRef = useRef(null);
  const { modal, toast, showSuccess, showError, showInfo, showConfirm, closeModal, closeToast } = useModal();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    const result = await getBlogPosts(false);
    if (result.success) {
      setArticles(result.data);
    }
  };

  useEffect(() => {
    if (showForm && editorRef.current) {
      const content = formData.content || '';
      editorRef.current.innerHTML = content;
      
      // Forzar dirección LTR
      editorRef.current.setAttribute('dir', 'ltr');
      editorRef.current.style.direction = 'ltr';
      editorRef.current.style.textAlign = 'left';
      
      // Agregar estilos y asegurar que los links sean editables
      const links = editorRef.current.querySelectorAll('a');
      links.forEach((link) => {
        link.className = 'blog-link';
        // Aplicar estilos con !important incluyendo border-bottom
        link.style.setProperty('text-decoration', 'underline', 'important');
        link.style.setProperty('text-decoration-line', 'underline', 'important');
        link.style.setProperty('text-decoration-style', 'solid', 'important');
        link.style.setProperty('border-bottom', '1px solid currentColor', 'important');
        link.style.setProperty('cursor', 'pointer', 'important');
        link.style.setProperty('color', 'inherit', 'important');
        // Mantener href pero prevenir navegación
        link.setAttribute('contenteditable', 'false');
      });
      
      // Mover el cursor al final del contenido solo si está vacío
      if (!content.trim()) {
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [showForm]);
  
  // Efecto separado para cuando cambia el contenido (al editar)
  useEffect(() => {
    if (showForm && editorRef.current && editingId) {
      // Aplicar estilos a links después de cargar
      setTimeout(() => {
        const links = editorRef.current.querySelectorAll('a');
        links.forEach((link) => {
          link.className = 'blog-link';
          link.style.textDecoration = 'underline';
          link.style.cursor = 'pointer';
          link.style.color = 'inherit';
          link.setAttribute('contenteditable', 'false');
        });
      }, 0);
    }
  }, [formData.content, editingId, showForm]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showForm || !editorRef.current) return;
      if (!editorRef.current.contains(document.activeElement) && document.activeElement !== editorRef.current) return;

      // Ctrl+B: Bold
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        document.execCommand('bold', false, null);
      }
      // Ctrl+I: Italic
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        document.execCommand('italic', false, null);
      }
      // Ctrl+U: Underline
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        document.execCommand('underline', false, null);
      }
      // Ctrl+K: Link
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        handleLinkShortcut();
      }
      // Ctrl+P: Image
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        handleImageShortcut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForm]);

  const resetForm = () => {
    setFormData({
      title: '',
      metaTitle: '',
      content: '',
      publishedAt: new Date().toISOString().split('T')[0],
    });
    setEditingId(null);
    setShowForm(false);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      // Asegurar que siempre tenga dirección LTR
      editorRef.current.setAttribute('dir', 'ltr');
      editorRef.current.style.direction = 'ltr';
      
      // Asegurar que todos los links tengan los estilos correctos antes de guardar
      const links = editorRef.current.querySelectorAll('a');
      links.forEach((link) => {
        link.className = 'blog-link';
        // Aplicar estilos con !important usando setProperty
        link.style.setProperty('text-decoration', 'underline', 'important');
        link.style.setProperty('text-decoration-line', 'underline', 'important');
        link.style.setProperty('text-decoration-style', 'solid', 'important');
        link.style.setProperty('cursor', 'pointer', 'important');
        link.style.setProperty('color', 'inherit', 'important');
      });
      
      setFormData((prev) => ({ ...prev, content: editorRef.current.innerHTML }));
    }
  };

  const handleEditorKeyDown = (e) => {
    // Permitir Backspace normalmente
    if (e.key === 'Backspace' || e.key === 'Delete') {
      return; // Permitir el comportamiento por defecto
    }
    // Prevenir otros comportamientos no deseados
  };

  const handleEditorFocus = () => {
    if (editorRef.current) {
      editorRef.current.setAttribute('dir', 'ltr');
      editorRef.current.style.direction = 'ltr';
      editorRef.current.style.textAlign = 'left';
    }
  };

  const handleFormat = (command) => {
    document.execCommand(command, false, null);
    editorRef.current?.focus();
    handleContentChange();
  };

  const handleLinkShortcut = () => {
    const selection = window.getSelection();
    const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    
    // Verificar si el cursor está dentro de un link existente
    if (range) {
      const container = range.commonAncestorContainer;
      const linkElement = container.nodeType === 3 
        ? container.parentElement.closest('a')
        : container.closest('a');
      
      if (linkElement && linkElement.closest('[contenteditable]')) {
        // Estamos dentro de un link, editarlo
        handleEditLink(linkElement);
        return;
      }
    }
    
    // Crear nuevo link
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      setEditingLink(null);
      setShowLinkDialog(true);
      setLinkUrl('');
    } else {
      showInfo('Seleccioná el texto al que querés agregar el link');
    }
  };

  const handleImageShortcut = () => {
    setShowImageDialog(true);
    setImageUrl('');
    setImageCaption('');
  };

  const insertLink = () => {
    if (!linkUrl.trim()) {
      showError('Ingresá una URL válida');
      return;
    }
    
    // Si estamos editando un link existente
    if (editingLink) {
      editingLink.setAttribute('href', linkUrl);
      editingLink.style.setProperty('text-decoration', 'underline', 'important');
      editingLink.style.setProperty('text-decoration-line', 'underline', 'important');
      editingLink.style.setProperty('text-decoration-style', 'solid', 'important');
      editingLink.style.setProperty('cursor', 'pointer', 'important');
      editingLink.style.setProperty('color', 'inherit', 'important');
      setEditingLink(null);
      setShowLinkDialog(false);
      setLinkUrl('');
      editorRef.current?.focus();
      handleContentChange();
      return;
    }

    // Crear nuevo link
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const link = document.createElement('a');
      link.setAttribute('href', linkUrl);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.setAttribute('contenteditable', 'false');
      link.className = 'blog-link';
      link.style.setProperty('cursor', 'pointer', 'important');
      link.style.setProperty('color', 'inherit', 'important');
      
      // Envolver el contenido en un span con border-bottom para el subrayado
      // Esto evita que los resets de CSS de links afecten el subrayado
      const span = document.createElement('span');
      span.style.borderBottom = '1px solid currentColor';
      span.style.textDecoration = 'underline';
      
      try {
        // Intentar envolver el contenido directamente
        const contents = range.extractContents();
        span.appendChild(contents);
        link.appendChild(span);
        range.insertNode(link);
      } catch (e) {
        // Método alternativo: crear el contenido manualmente
        const text = selection.toString();
        span.textContent = text;
        link.appendChild(span);
        range.deleteContents();
        range.insertNode(link);
      }
      
      // Forzar actualización inmediata y verificar
      setTimeout(() => {
        if (link.parentNode) {
          // Re-aplicar estilos con !important incluyendo box-shadow
          link.style.setProperty('text-decoration', 'underline', 'important');
          link.style.setProperty('text-decoration-line', 'underline', 'important');
          link.style.setProperty('text-decoration-style', 'solid', 'important');
          link.style.setProperty('border-bottom', '1px solid currentColor', 'important');
          link.style.setProperty('border-bottom-width', '1px', 'important');
          link.style.setProperty('border-bottom-style', 'solid', 'important');
          link.style.setProperty('border-bottom-color', 'currentColor', 'important');
          link.style.setProperty('box-shadow', '0 1px 0 0 currentColor', 'important');
          link.style.setProperty('cursor', 'pointer', 'important');
          link.style.setProperty('color', 'inherit', 'important');
          
          // Forzar repaint
          void link.offsetHeight;
        }
        editorRef.current?.focus();
        handleContentChange();
      }, 50);
    }
    setShowLinkDialog(false);
    setLinkUrl('');
  };

  const handleEditLink = (linkElement) => {
    setEditingLink(linkElement);
    // Obtener href
    const href = linkElement.getAttribute('href') || linkElement.href || '';
    setLinkUrl(href);
    setShowLinkDialog(true);
  };

  const handleEditorClick = (e) => {
    // Detectar clic en un link
    const target = e.target;
    if (target.tagName === 'A' && target.closest('[contenteditable]')) {
      e.preventDefault();
      e.stopPropagation();
      handleEditLink(target);
    }
  };
  
  const handleEditorMouseDown = (e) => {
    // También capturar mousedown para links
    const target = e.target;
    if (target.tagName === 'A' && target.closest('[contenteditable]')) {
      e.preventDefault();
      e.stopPropagation();
      handleEditLink(target);
    }
  };

  const insertImage = () => {
    if (!imageUrl.trim()) {
      showError('Ingresá una URL de imagen válida');
      return;
    }
    if (editorRef.current) {
      const selection = window.getSelection();
      const range = selection.rangeCount > 0 ? selection.getRangeAt(0) : document.createRange();
      
      // Crear contenedor de imagen
      const imageContainer = document.createElement('div');
      imageContainer.className = 'blog-image-container';
      imageContainer.style.marginTop = '1rem';
      imageContainer.style.marginBottom = '1rem';

      // Crear imagen
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = imageCaption || 'Imagen del artículo';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '0.5rem';
      imageContainer.appendChild(img);

      // Crear pie de foto si existe
      if (imageCaption.trim()) {
        const caption = document.createElement('p');
        caption.className = 'blog-image-caption';
        caption.style.fontSize = '0.875rem';
        caption.style.fontStyle = 'italic';
        caption.style.color = 'inherit';
        caption.style.opacity = '0.7';
        caption.style.marginTop = '0.5rem';
        caption.style.textAlign = 'center';
        caption.textContent = imageCaption;
        imageContainer.appendChild(caption);
      }

      // Insertar al final del contenido
      if (editorRef.current.innerHTML.trim()) {
        editorRef.current.appendChild(document.createElement('br'));
      }
      editorRef.current.appendChild(imageContainer);
      editorRef.current.appendChild(document.createElement('br'));

      editorRef.current.focus();
      handleContentChange();
    }
    setShowImageDialog(false);
    setImageUrl('');
    setImageCaption('');
  };

  const handleSave = async () => {
    // Traducir automáticamente si hay contenido en español pero no en inglés
    let finalFormData = { ...formData };
    
    if (isTranslateAvailable()) {
      // Si falta título en inglés pero hay en español, traducir
      if (!finalFormData.title && finalFormData.titleEs) {
        const result = await translateText(finalFormData.titleEs, 'en', 'es');
        if (result.success) {
          finalFormData.title = result.translatedText;
        }
      }
      
      // Si falta metaTitle en inglés pero hay en español, traducir
      if (!finalFormData.metaTitle && finalFormData.metaTitleEs) {
        const result = await translateText(finalFormData.metaTitleEs, 'en', 'es');
        if (result.success) {
          finalFormData.metaTitle = result.translatedText;
        }
      }
      
      // Si falta content en inglés pero hay en español, traducir (HTML)
      const htmlContentEs = editorRefEs.current?.innerHTML || finalFormData.contentEs;
      const htmlContent = editorRef.current?.innerHTML || finalFormData.content;
      if (!htmlContent && htmlContentEs) {
        const result = await translateText(htmlContentEs, 'en', 'es', true); // isHtml = true
        if (result.success) {
          if (editorRef.current) {
            editorRef.current.innerHTML = result.translatedText;
          }
          finalFormData.content = result.translatedText;
        }
      }
    }

    // Validar que al menos los campos en inglés estén completos (o se hayan traducido)
    const htmlContent = editorRef.current?.innerHTML || finalFormData.content;
    if (!finalFormData.title || !finalFormData.metaTitle || !htmlContent) {
      showError('Por favor completá todos los campos requeridos');
      return;
    }

    const articleData = {
      title: finalFormData.title,
      titleEs: finalFormData.titleEs || '',
      metaTitle: finalFormData.metaTitle,
      metaTitleEs: finalFormData.metaTitleEs || '',
      summary: finalFormData.metaTitle,
      content: htmlContent,
      contentEs: editorRefEs.current?.innerHTML || finalFormData.contentEs || '',
      publishedAt: finalFormData.publishedAt || new Date().toISOString().split('T')[0],
      status: 'published',
      isPublic: true,
    };

    if (editingId) {
      const result = await updateBlogPost(editingId, articleData);
      if (result.success) {
        await loadArticles();
        showSuccess('Artículo actualizado correctamente');
        resetForm();
      } else {
        showError('Error al actualizar: ' + result.error);
      }
    } else {
      const result = await createBlogPost(articleData);
      if (result.success) {
        await loadArticles();
        showSuccess('Artículo creado correctamente');
        resetForm();
      } else {
        showError('Error al crear: ' + result.error);
      }
    }
  };

  const handleEdit = (article) => {
    setFormData({
      title: article.title || '',
      titleEs: article.titleEs || '',
      metaTitle: article.metaTitle || article.summary || '',
      metaTitleEs: article.metaTitleEs || '',
      content: article.content || article.summary || '',
      contentEs: article.contentEs || '',
      publishedAt: article.publishedAt || new Date().toISOString().split('T')[0],
    });
    setEditingId(article.id);
    setShowForm(true);
    
    // Cargar contenido HTML en los editores
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = article.content || '';
      }
      if (editorRefEs.current) {
        editorRefEs.current.innerHTML = article.contentEs || '';
      }
    }, 100);
  };

  const handleDelete = async (id) => {
    showConfirm(
      '¿Estás seguro de que querés eliminar este artículo?',
      async () => {
        const result = await deleteBlogPost(id);
        if (result.success) {
          await loadArticles();
          if (editingId === id) {
            resetForm();
          }
          showSuccess('Artículo eliminado correctamente');
        } else {
          showError('Error al eliminar: ' + result.error);
        }
      },
      'Eliminar artículo'
    );
  };

  return (
    <div className="space-y-8 rounded-2xl border border-primary/10 bg-white/60 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/60">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary dark:text-linkDark">Gestión del Blog</h2>
          <p className="mt-1 text-sm text-linkLight/80 dark:text-linkDark/80">
            Creá y administrá los artículos del blog con editor de texto enriquecido. Usá los shortcuts: Ctrl+B (negrita), Ctrl+I (cursiva), Ctrl+U (subrayado), Ctrl+K (link), Ctrl+P (imagen).
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-gradient inline-flex items-center gap-2 text-xs uppercase"
        >
          <FiPlus size={16} />
          Nuevo artículo
        </button>
      </header>

      {showForm && (
        <div className="rounded-2xl border border-primary/10 bg-white/80 p-6 shadow-sm transition-colors duration-300 dark:border-primary/20 dark:bg-darkBg/70">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-primary dark:text-linkDark">
              {editingId ? 'Editar artículo' : 'Nuevo artículo'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-linkLight/60 hover:text-accent dark:text-linkDark/60 dark:hover:text-primary"
            >
              <FiX size={20} />
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4"
          >
            <div className="space-y-4">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                    Inglés (requerido)
                  </h4>
                  {(formData.titleEs || formData.metaTitleEs || formData.contentEs) && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!isTranslateAvailable()) {
                          alert('Google Translate API no está configurada.');
                          return;
                        }
                        setTranslating({ title: true, metaTitle: true, content: true });
                        const translations = await Promise.all([
                          formData.titleEs ? translateText(formData.titleEs, 'en', 'es') : Promise.resolve({ success: false }),
                          formData.metaTitleEs ? translateText(formData.metaTitleEs, 'en', 'es') : Promise.resolve({ success: false }),
                          formData.contentEs ? translateText(editorRefEs.current?.innerHTML || formData.contentEs, 'en', 'es', true) : Promise.resolve({ success: false }),
                        ]);
                        setFormData(prev => ({
                          ...prev,
                          title: translations[0].success ? translations[0].translatedText : prev.title,
                          metaTitle: translations[1].success ? translations[1].translatedText : prev.metaTitle,
                          content: translations[2].success ? translations[2].translatedText : prev.content,
                        }));
                        if (translations[2].success && editorRef.current) {
                          editorRef.current.innerHTML = translations[2].translatedText;
                        }
                        setTranslating({});
                      }}
                      disabled={translating.title || translating.metaTitle || translating.content}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/20 px-2 py-1 text-xs uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent disabled:opacity-50 dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                      title="Traducir campos en español a inglés"
                    >
                      <FiGlobe size={12} />
                      {translating.title || translating.metaTitle || translating.content ? 'Traduciendo...' : 'Traducir'}
                    </button>
                  )}
                </div>
                <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Título del artículo
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej. Minimalist Design Trends 2025"
                    className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  />
                </label>

                <label className="mt-4 flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Metatítulo breve (resumen)
                  <textarea
                    name="metaTitle"
                    value={formData.metaTitle}
                    onChange={handleInputChange}
                    rows={3}
                    required
                    placeholder="Brief description that appears in lists and previews..."
                    className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  />
                  <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                    Este texto aparece como resumen en las listas de artículos.
                  </p>
                </label>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                  Español (opcional, se traduce automáticamente al inglés)
                </h4>
                <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Título del artículo
                  <input
                    type="text"
                    name="titleEs"
                    value={formData.titleEs}
                    onChange={handleInputChange}
                    placeholder="Ej. Tendencias de diseño minimalista 2025"
                    className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  />
                </label>

                <label className="mt-4 flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Metatítulo breve (resumen)
                  <textarea
                    name="metaTitleEs"
                    value={formData.metaTitleEs}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Breve descripción que aparece en las listas y previews..."
                    className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                    Cuerpo del artículo - Inglés
                  </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFormat('bold')}
                    className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                    title="Negrita (Ctrl+B)"
                  >
                    <FiBold size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('italic')}
                    className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                    title="Cursiva (Ctrl+I)"
                  >
                    <FiItalic size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('underline')}
                    className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                    title="Subrayado (Ctrl+U)"
                  >
                    <FiUnderline size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleLinkShortcut}
                    className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                    title="Agregar link (Ctrl+K)"
                  >
                    <FiLink size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleImageShortcut}
                    className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                    title="Agregar imagen (Ctrl+P)"
                  >
                    <FiImage size={16} />
                  </button>
                </div>
              </div>
              <div
                ref={editorRef}
                contentEditable
                dir="ltr"
                onInput={handleContentChange}
                onBlur={handleContentChange}
                onKeyDown={handleEditorKeyDown}
                onFocus={handleEditorFocus}
                onClick={handleEditorClick}
                onMouseDown={handleEditorMouseDown}
                data-placeholder="Escribí el contenido completo del artículo aquí..."
                className="admin-blog-editor min-h-[300px] rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-linkLight/50 [&:empty:before]:dark:text-linkDark/50"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word',
                  direction: 'ltr',
                  textAlign: 'left',
                  unicodeBidi: 'embed',
                }}
              />
                <p className="mt-1 text-xs text-linkLight/60 dark:text-linkDark/60">
                  Usá los botones de formato o los shortcuts: Ctrl+B (negrita), Ctrl+I (cursiva), Ctrl+U (subrayado), Ctrl+K (link), Ctrl+P (imagen).
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                  Cuerpo del artículo - Español (opcional, se traduce automáticamente al inglés)
                </label>
                <div
                  ref={editorRefEs}
                  contentEditable
                  dir="ltr"
                  onInput={() => {
                    if (editorRefEs.current) {
                      setFormData(prev => ({ ...prev, contentEs: editorRefEs.current.innerHTML }));
                    }
                  }}
                  onBlur={() => {
                    if (editorRefEs.current) {
                      setFormData(prev => ({ ...prev, contentEs: editorRefEs.current.innerHTML }));
                    }
                  }}
                  data-placeholder="Escribí el contenido completo del artículo en español aquí..."
                  className="admin-blog-editor min-h-[300px] rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-linkLight/50 [&:empty:before]:dark:text-linkDark/50"
                  style={{
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    direction: 'ltr',
                    textAlign: 'left',
                    unicodeBidi: 'embed',
                  }}
                />
                <p className="mt-1 text-xs text-linkLight/60 dark:text-linkDark/60">
                  Podés escribir en español y se traducirá automáticamente al inglés al guardar.
                </p>
              </div>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
              <div className="flex items-center gap-2">
                <FiCalendar size={16} />
                Fecha de publicación
              </div>
              <input
                type="date"
                name="publishedAt"
                value={formData.publishedAt}
                onChange={handleInputChange}
                className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
              />
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-primary/20 px-4 py-2 text-sm uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-gradient inline-flex items-center gap-2 text-xs uppercase">
                <FiSave size={16} />
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dialog para agregar/editar link */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            ref={linkDialogRef}
            className="rounded-2xl border border-primary/10 bg-white/90 p-6 shadow-lg dark:border-primary/20 dark:bg-darkBg/90"
          >
            <h3 className="mb-4 text-lg font-semibold text-primary dark:text-linkDark">
              {editingLink ? 'Editar link' : 'Agregar link'}
            </h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://ejemplo.com"
              className="mb-4 w-full rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  insertLink();
                } else if (e.key === 'Escape') {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                  setEditingLink(null);
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                  setEditingLink(null);
                }}
                className="rounded-lg border border-primary/20 px-4 py-2 text-sm text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
              >
                Cancelar
              </button>
              {editingLink && (
                <button
                  type="button"
                  onClick={() => {
                    // Eliminar link si se está editando
                    const text = editingLink.textContent;
                    const textNode = document.createTextNode(text);
                    editingLink.parentNode.replaceChild(textNode, editingLink);
                    handleContentChange();
                    setShowLinkDialog(false);
                    setLinkUrl('');
                    setEditingLink(null);
                  }}
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-500 transition-colors duration-200 hover:border-red-500 hover:text-red-600 dark:border-red-500/50 dark:text-red-400"
                >
                  Eliminar link
                </button>
              )}
              <button
                type="button"
                onClick={insertLink}
                className="btn-gradient inline-flex items-center gap-2 text-xs uppercase"
              >
                {editingLink ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog para agregar imagen */}
      {showImageDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            ref={imageDialogRef}
            className="rounded-2xl border border-primary/10 bg-white/90 p-6 shadow-lg dark:border-primary/20 dark:bg-darkBg/90"
          >
            <h3 className="mb-4 text-lg font-semibold text-primary dark:text-linkDark">Agregar imagen</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  URL de la imagen
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="/images/blog/mi-imagen.jpg"
                  className="w-full rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                  Pie de foto (opcional)
                </label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Descripción de la imagen..."
                  className="w-full rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowImageDialog(false);
                      setImageUrl('');
                      setImageCaption('');
                    }
                  }}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowImageDialog(false);
                  setImageUrl('');
                  setImageCaption('');
                }}
                className="rounded-lg border border-primary/20 px-4 py-2 text-sm text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={insertImage}
                className="btn-gradient inline-flex items-center gap-2 text-xs uppercase"
              >
                Agregar imagen
              </button>
            </div>
          </div>
        </div>
      )}

      <section>
        <h3 className="mb-4 text-xl font-semibold text-primary dark:text-linkDark">Artículos del blog</h3>
        <div className="space-y-4">
          {articles.length === 0 ? (
            <p className="text-sm text-linkLight/60 dark:text-linkDark/60">
              No hay artículos. Agregá uno nuevo para comenzar.
            </p>
          ) : (
            articles.map((article) => (
              <div
                key={article.id}
                className="rounded-xl border border-primary/10 bg-white/80 p-5 transition-colors duration-200 dark:border-primary/20 dark:bg-darkBg/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-primary dark:text-linkDark">
                        {article.title}
                      </h4>
                      {article.publishedAt && (
                        <span className="text-xs uppercase tracking-widest text-linkLight/60 dark:text-linkDark/60">
                          <FiCalendar size={12} className="inline mr-1" />
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-linkLight/70 dark:text-linkDark/70">
                      {article.metaTitle || article.summary}
                    </p>
                    <div
                      className="mt-3 text-xs text-linkLight/60 dark:text-linkDark/60"
                      dangerouslySetInnerHTML={{
                        __html: article.content?.substring(0, 150) + '...' || '',
                      }}
                    />
                    {article.readingTime && (
                      <p className="mt-2 text-xs uppercase tracking-widest text-linkLight/50 dark:text-linkDark/50">
                        Tiempo de lectura: {article.readingTime}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(article)}
                      className="rounded-lg border border-primary/20 p-2 text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
                    >
                      <FiEdit3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(article.id)}
                      className="rounded-lg border border-red-300 p-2 text-red-500 transition-colors duration-200 hover:border-red-500 hover:text-red-600 dark:border-red-500/50 dark:text-red-400"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />

      <Toast
        isOpen={toast.isOpen}
        onClose={closeToast}
        message={toast.message}
      />
    </div>
  );
};

export default BlogEditor;
