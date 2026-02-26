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
    titleEs: '',
    metaTitleEs: '',
    contentEs: '',
    publishedAt: '',
    tags: '',
  });
  const editorRefEs = useRef(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [editingLink, setEditingLink] = useState(null);
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
    if (showForm && editorRefEs.current) {
      const content = formData.contentEs || '';
      editorRefEs.current.innerHTML = content;
      
      // Forzar dirección LTR
      editorRefEs.current.setAttribute('dir', 'ltr');
      editorRefEs.current.style.direction = 'ltr';
      editorRefEs.current.style.textAlign = 'left';
      
      // Agregar estilos y asegurar que los links sean editables
      const links = editorRefEs.current.querySelectorAll('a');
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
        range.selectNodeContents(editorRefEs.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, [showForm]);
  
  // Efecto separado para cuando cambia el contenido (al editar)
  useEffect(() => {
    if (showForm && editorRefEs.current && editingId) {
      // Aplicar estilos a links después de cargar
      setTimeout(() => {
        const links = editorRefEs.current.querySelectorAll('a');
        links.forEach((link) => {
          link.className = 'blog-link';
          link.style.textDecoration = 'underline';
          link.style.cursor = 'pointer';
          link.style.color = 'inherit';
          link.setAttribute('contenteditable', 'false');
        });
      }, 0);
    }
  }, [formData.contentEs, editingId, showForm]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showForm || !editorRefEs.current) return;
      if (!editorRefEs.current.contains(document.activeElement) && document.activeElement !== editorRefEs.current) return;

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
      titleEs: '',
      metaTitleEs: '',
      contentEs: '',
      publishedAt: new Date().toISOString().split('T')[0],
      tags: '',
    });
    setEditingId(null);
    setShowForm(false);
    if (editorRefEs.current) {
      editorRefEs.current.innerHTML = '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = () => {
    if (editorRefEs.current) {
      // Asegurar que siempre tenga dirección LTR
      editorRefEs.current.setAttribute('dir', 'ltr');
      editorRefEs.current.style.direction = 'ltr';
      
      // Asegurar que todos los links tengan los estilos correctos antes de guardar
      const links = editorRefEs.current.querySelectorAll('a');
      links.forEach((link) => {
        link.className = 'blog-link';
        // Aplicar estilos con !important usando setProperty
        link.style.setProperty('text-decoration', 'underline', 'important');
        link.style.setProperty('text-decoration-line', 'underline', 'important');
        link.style.setProperty('text-decoration-style', 'solid', 'important');
        link.style.setProperty('cursor', 'pointer', 'important');
        link.style.setProperty('color', 'inherit', 'important');
      });
      
      setFormData((prev) => ({ ...prev, contentEs: editorRefEs.current.innerHTML }));
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
    if (editorRefEs.current) {
      editorRefEs.current.setAttribute('dir', 'ltr');
      editorRefEs.current.style.direction = 'ltr';
      editorRefEs.current.style.textAlign = 'left';
    }
  };

  const handleFormat = (command) => {
    document.execCommand(command, false, null);
    editorRefEs.current?.focus();
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
      editorRefEs.current?.focus();
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
        editorRefEs.current?.focus();
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
    if (editorRefEs.current) {
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
      if (editorRefEs.current.innerHTML.trim()) {
        editorRefEs.current.appendChild(document.createElement('br'));
      }
      editorRefEs.current.appendChild(imageContainer);
      editorRefEs.current.appendChild(document.createElement('br'));

      editorRefEs.current.focus();
      handleContentChange();
    }
    setShowImageDialog(false);
    setImageUrl('');
    setImageCaption('');
  };

  // Función para limpiar y normalizar los links en el HTML
  const cleanLinksInHtml = (html) => {
    if (!html) return html;
    
    // Crear un elemento temporal para procesar el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Encontrar todos los links
    const links = tempDiv.querySelectorAll('a');
    links.forEach((link) => {
      // Remover contenteditable si existe
      link.removeAttribute('contenteditable');
      
      // Obtener el href actual
      let href = link.getAttribute('href') || link.href || '';
      
      // Si no tiene href, intentar obtenerlo del texto si es una URL
      if (!href) {
        const textContent = link.textContent || link.innerText || '';
        if (textContent.match(/^https?:\/\//)) {
          href = textContent.trim();
        }
      }
      
      // Si aún no hay href, saltar este link
      if (!href) {
        // Convertir el link en texto plano
        const textNode = document.createTextNode(link.textContent || link.innerText || '');
        link.parentNode?.replaceChild(textNode, link);
        return;
      }
      
      // Asegurar que tenga href válido
      link.setAttribute('href', href);
      
      // Asegurar target y rel para links externos
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        if (!link.getAttribute('target')) {
          link.setAttribute('target', '_blank');
        }
        if (!link.getAttribute('rel')) {
          link.setAttribute('rel', 'noopener noreferrer');
        }
      }
      
      // Remover spans innecesarios dentro del link y mover su contenido directamente al link
      const spans = link.querySelectorAll('span');
      spans.forEach((span) => {
        // Mover el contenido del span al link
        while (span.firstChild) {
          link.insertBefore(span.firstChild, span);
        }
        // Remover el span
        span.remove();
      });
      
      // Limpiar estilos inline que puedan interferir, pero mantener la clase
      link.className = 'blog-link';
      link.removeAttribute('style');
      
      // Asegurar que el link tenga contenido de texto
      if (!link.textContent && !link.innerText) {
        link.textContent = href;
      }
    });
    
    return tempDiv.innerHTML;
  };

  const handleSave = async () => {
    // Obtener el contenido HTML del editor en español
    let htmlContentEs = editorRefEs.current?.innerHTML || formData.contentEs || '';
    
    // Limpiar y normalizar los links
    htmlContentEs = cleanLinksInHtml(htmlContentEs);
    
    const titleEs = formData.titleEs || '';
    const metaTitleEs = formData.metaTitleEs || '';

    // Validar que los campos en español estén completos
    if (!titleEs || !metaTitleEs || !htmlContentEs) {
      showError('Por favor completá todos los campos requeridos (título, meta título y contenido)');
      return;
    }

    // Procesar tags (separar por comas y limpiar)
    const tagsArray = formData.tags
      ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    // Preparar datos del artículo en español
    const articleData = {
      title: titleEs,
      titleEs: titleEs,
      metaTitle: metaTitleEs,
      metaTitleEs: metaTitleEs,
      summary: metaTitleEs,
      content: htmlContentEs,
      contentEs: htmlContentEs,
      tags: tagsArray,
      publishedAt: formData.publishedAt || new Date().toISOString().split('T')[0],
      status: 'published',
      isPublic: true,
    };

    // Traducir automáticamente al inglés
    let articleEn = null;
    
    if (isTranslateAvailable()) {
      const translations = await Promise.all([
        translateText(titleEs, 'en', 'es', false), // Título sin HTML
        translateText(metaTitleEs, 'en', 'es', false), // Meta título sin HTML
        translateText(htmlContentEs, 'en', 'es', true), // Contenido con HTML
      ]);

      articleEn = {
        title: translations[0].success ? translations[0].translatedText : titleEs,
        titleEs: titleEs,
        metaTitle: translations[1].success ? translations[1].translatedText : metaTitleEs,
        metaTitleEs: metaTitleEs,
        summary: translations[1].success ? translations[1].translatedText : metaTitleEs,
        content: translations[2].success ? translations[2].translatedText : htmlContentEs,
        contentEs: htmlContentEs,
        tags: tagsArray, // Los tags se mantienen iguales en ambos idiomas
        publishedAt: articleData.publishedAt,
        status: 'published',
        isPublic: true,
      };
    } else {
      // Si no hay traducción disponible, usar el mismo contenido
      articleEn = {
        ...articleData,
      };
    }

    if (editingId) {
      const result = await updateBlogPost(editingId, articleData, articleEn);
      if (result.success) {
        await loadArticles();
        showSuccess('Artículo actualizado correctamente');
        resetForm();
      } else {
        showError('Error al actualizar: ' + result.error);
      }
    } else {
      const result = await createBlogPost(articleData, articleEn);
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
    // Cargar solo los campos en español (o usar los de inglés si no hay español)
    setFormData({
      titleEs: article.titleEs || article.title || '',
      metaTitleEs: article.metaTitleEs || article.metaTitle || article.summary || '',
      contentEs: article.contentEs || article.content || '',
      publishedAt: article.publishedAt || new Date().toISOString().split('T')[0],
      tags: article.tags ? article.tags.join(', ') : '',
    });
    setEditingId(article.id);
    setShowForm(true);
    
    // Cargar contenido HTML en el editor
    setTimeout(() => {
      if (editorRefEs.current) {
        editorRefEs.current.innerHTML = article.contentEs || article.content || '';
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
              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Título del artículo
                <input
                  type="text"
                  name="titleEs"
                  value={formData.titleEs}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej. Tendencias de diseño minimalista 2025"
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
                <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                  Se traducirá automáticamente al inglés al guardar.
                </p>
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                Metatítulo breve (resumen)
                <textarea
                  name="metaTitleEs"
                  value={formData.metaTitleEs}
                  onChange={handleInputChange}
                  rows={3}
                  required
                  placeholder="Breve descripción que aparece en las listas y previews..."
                  className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
                />
                <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                  Este texto aparece como resumen en las listas de artículos. Se traducirá automáticamente al inglés al guardar.
                </p>
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
                    Cuerpo del artículo
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
                  ref={editorRefEs}
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
                  Usá los botones de formato o los shortcuts: Ctrl+B (negrita), Ctrl+I (cursiva), Ctrl+U (subrayado), Ctrl+K (link), Ctrl+P (imagen). Se traducirá automáticamente al inglés al guardar.
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

            <label className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-widest text-linkLight/80 dark:text-linkDark/80">
              Tags
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="Ej: diseño, desarrollo, react, javascript (separados por comas)"
                className="rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
              />
              <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
                Separá los tags con comas. Se usarán para recomendaciones de artículos relacionados.
              </p>
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
