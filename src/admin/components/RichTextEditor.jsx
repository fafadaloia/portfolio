import { useRef, useEffect, useState } from 'react';
import { FiBold, FiItalic, FiUnderline, FiLink, FiImage } from 'react-icons/fi';

const RichTextEditor = ({ value, onChange, placeholder = 'Escribí aquí...', minHeight = '200px' }) => {
  const editorRef = useRef(null);
  const isUserTypingRef = useRef(false);
  const lastValueRef = useRef('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageCaption, setImageCaption] = useState('');
  const [editingLink, setEditingLink] = useState(null);

  // Guardar posición del cursor de manera más robusta
  const saveSelection = () => {
    if (!editorRef.current) return null;
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Solo guardar si el rango está dentro del editor
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        try {
          return range.cloneRange();
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  // Restaurar posición del cursor
  const restoreSelection = (savedRange) => {
    if (!savedRange || !editorRef.current) return;
    const selection = window.getSelection();
    try {
      // Verificar que el rango aún es válido
      if (editorRef.current.contains(savedRange.startContainer)) {
        selection.removeAllRanges();
        selection.addRange(savedRange);
      } else {
        // Si el rango ya no es válido, colocar el cursor al final
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (e) {
      // Si falla, intentar colocar el cursor al final
      try {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } catch (e2) {
        // Ignorar errores
      }
    }
  };

  // Inicializar el editor una vez
  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      // Solo inicializar si está vacío
      if (!editorRef.current.innerHTML && (value || '')) {
        editorRef.current.innerHTML = value || '';
        lastValueRef.current = value || '';
        editorRef.current.setAttribute('dir', 'ltr');
        editorRef.current.style.direction = 'ltr';
        editorRef.current.style.textAlign = 'left';
        editorRef.current.setAttribute('data-dir-set', 'true');
        
        // Aplicar estilos a links
        const links = editorRef.current.querySelectorAll('a');
        links.forEach((link) => {
          link.className = 'blog-link';
          link.style.setProperty('text-decoration', 'underline', 'important');
          link.style.setProperty('text-decoration-line', 'underline', 'important');
          link.style.setProperty('text-decoration-style', 'solid', 'important');
          link.style.setProperty('border-bottom', '1px solid currentColor', 'important');
          link.style.setProperty('cursor', 'pointer', 'important');
          link.style.setProperty('color', 'inherit', 'important');
          link.setAttribute('contenteditable', 'false');
        });
      }
    }
  }, []); // Solo ejecutar una vez al montar

  // Actualizar desde props solo cuando no es el usuario escribiendo
  useEffect(() => {
    if (editorRef.current && value !== undefined) {
      const currentContent = editorRef.current.innerHTML;
      const newContent = value || '';
      
      // Solo actualizar si el contenido realmente cambió Y no es el usuario escribiendo
      if (currentContent !== newContent && !isUserTypingRef.current && lastValueRef.current !== newContent) {
        const savedRange = saveSelection();
        
        editorRef.current.innerHTML = newContent;
        lastValueRef.current = newContent;
        
        // Aplicar estilos a links
        const links = editorRef.current.querySelectorAll('a');
        links.forEach((link) => {
          link.className = 'blog-link';
          link.style.setProperty('text-decoration', 'underline', 'important');
          link.style.setProperty('text-decoration-line', 'underline', 'important');
          link.style.setProperty('text-decoration-style', 'solid', 'important');
          link.style.setProperty('border-bottom', '1px solid currentColor', 'important');
          link.style.setProperty('cursor', 'pointer', 'important');
          link.style.setProperty('color', 'inherit', 'important');
          link.setAttribute('contenteditable', 'false');
        });
        
        // Restaurar la selección
        requestAnimationFrame(() => {
          restoreSelection(savedRange);
        });
      }
    }
  }, [value]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!editorRef.current) return;
      if (!editorRef.current.contains(document.activeElement) && document.activeElement !== editorRef.current) return;

      // Ctrl+B: Bold
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        document.execCommand('bold', false, null);
        handleContentChange();
        return;
      }
      // Ctrl+I: Italic
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();
        document.execCommand('italic', false, null);
        handleContentChange();
        return;
      }
      // Ctrl+U: Underline
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        document.execCommand('underline', false, null);
        handleContentChange();
        return;
      }
      // Ctrl+K: Link
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        handleLinkShortcut();
        return;
      }
      // Ctrl+P: Image
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        setShowImageDialog(true);
        setImageUrl('');
        setImageCaption('');
        return;
      }
      
      // Enter: Crear nuevo párrafo
      if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        document.execCommand('insertParagraph', false, null);
        handleContentChange();
        return;
      }

      // Detectar "> " o "< " cuando se presiona espacio
      if (e.key === ' ' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          let textNode = range.startContainer;
          
          // Si el nodo no es un nodo de texto, buscar el nodo de texto más cercano
          if (textNode.nodeType !== Node.TEXT_NODE) {
            // Intentar encontrar un nodo de texto hijo
            const walker = document.createTreeWalker(
              textNode,
              NodeFilter.SHOW_TEXT,
              null
            );
            textNode = walker.nextNode() || textNode;
          }
          
          if (textNode && textNode.nodeType === Node.TEXT_NODE) {
            const text = textNode.textContent;
            const cursorPosition = range.startOffset;
            
            // Verificar si hay "<" justo antes del cursor
            if (cursorPosition >= 1 && text.substring(cursorPosition - 1, cursorPosition) === '<') {
              e.preventDefault();
              // Reemplazar "<" con "◇ " (diamante blanco + espacio)
              const before = text.substring(0, cursorPosition - 1);
              const after = text.substring(cursorPosition);
              textNode.textContent = before + '◇ ' + after;
              
              // Mover el cursor después del símbolo y el espacio
              // Reemplazamos 1 carácter ("<") con 2 caracteres ("◇ ")
              const newPosition = cursorPosition - 1 + 2;
              const newRange = document.createRange();
              newRange.setStart(textNode, Math.min(newPosition, textNode.textContent.length));
              newRange.setEnd(textNode, Math.min(newPosition, textNode.textContent.length));
              selection.removeAllRanges();
              selection.addRange(newRange);
              
              handleContentChange();
              return;
            }
            
            // Verificar si hay ">" justo antes del cursor
            if (cursorPosition >= 1 && text.substring(cursorPosition - 1, cursorPosition) === '>') {
              e.preventDefault();
              // Reemplazar ">" con "◆ " (diamante negro + espacio)
              const before = text.substring(0, cursorPosition - 1);
              const after = text.substring(cursorPosition);
              textNode.textContent = before + '◆ ' + after;
              
              // Mover el cursor después del símbolo y el espacio
              // Reemplazamos 1 carácter (">") con 2 caracteres ("◆ ")
              const newPosition = cursorPosition - 1 + 2;
              const newRange = document.createRange();
              newRange.setStart(textNode, Math.min(newPosition, textNode.textContent.length));
              newRange.setEnd(textNode, Math.min(newPosition, textNode.textContent.length));
              selection.removeAllRanges();
              selection.addRange(newRange);
              
              handleContentChange();
              return;
            }
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Normalizar HTML: convertir estilos inline a etiquetas HTML y preservar párrafos
  const normalizeHTML = (html) => {
    if (!html) return html;
    
    // Crear un elemento temporal para procesar el HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Si no hay párrafos, envolver el contenido en párrafos basándose en <br><br> o dobles saltos
    const hasParagraphs = tempDiv.querySelectorAll('p').length > 0;
    
    if (!hasParagraphs) {
      // Dividir por <br><br> o múltiples <br> seguidos
      const content = tempDiv.innerHTML;
      // Reemplazar <br><br> o <br></br><br> con separador de párrafos
      const withParagraphs = content
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '</p><p>')
        .replace(/<br\s*\/?>/gi, '<br>');
      
      // Envolver en párrafos si hay contenido
      if (withParagraphs.trim()) {
        tempDiv.innerHTML = '<p>' + withParagraphs + '</p>';
      }
    }
    
    // Convertir spans con font-weight: bold a <strong>
    const boldSpans = tempDiv.querySelectorAll('span[style*="font-weight"], span[style*="fontWeight"]');
    boldSpans.forEach((span) => {
      const style = span.getAttribute('style') || '';
      if (style.includes('font-weight:') || style.includes('fontWeight:')) {
        const fontWeight = span.style.fontWeight || window.getComputedStyle(span).fontWeight;
        if (parseInt(fontWeight) >= 600 || fontWeight === 'bold' || fontWeight === 'bolder') {
          const strong = document.createElement('strong');
          strong.innerHTML = span.innerHTML;
          span.parentNode.replaceChild(strong, span);
        }
      }
    });
    
    // Convertir spans con font-style: italic a <em>
    const italicSpans = tempDiv.querySelectorAll('span[style*="font-style"], span[style*="fontStyle"]');
    italicSpans.forEach((span) => {
      const style = span.getAttribute('style') || '';
      if (style.includes('font-style:') || style.includes('fontStyle:')) {
        const fontStyle = span.style.fontStyle || window.getComputedStyle(span).fontStyle;
        if (fontStyle === 'italic') {
          const em = document.createElement('em');
          em.innerHTML = span.innerHTML;
          span.parentNode.replaceChild(em, span);
        }
      }
    });
    
    // Convertir spans con text-decoration: underline a <u>
    const underlineSpans = tempDiv.querySelectorAll('span[style*="text-decoration"], span[style*="textDecoration"]');
    underlineSpans.forEach((span) => {
      const style = span.getAttribute('style') || '';
      if (style.includes('text-decoration:') || style.includes('textDecoration:')) {
        const textDecoration = span.style.textDecoration || window.getComputedStyle(span).textDecoration;
        if (textDecoration.includes('underline')) {
          const u = document.createElement('u');
          u.innerHTML = span.innerHTML;
          span.parentNode.replaceChild(u, span);
        }
      }
    });
    
    return tempDiv.innerHTML;
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      // Marcar que el usuario está escribiendo
      isUserTypingRef.current = true;
      let currentContent = editorRef.current.innerHTML;
      
      // Normalizar el HTML para convertir estilos inline a etiquetas HTML
      currentContent = normalizeHTML(currentContent);
      
      // Si el contenido cambió después de normalizar, actualizar el editor
      if (currentContent !== editorRef.current.innerHTML) {
        const selection = saveSelection();
        editorRef.current.innerHTML = currentContent;
        restoreSelection(selection);
      }
      
      lastValueRef.current = currentContent;
      
      // No modificar dir/direction en cada cambio para evitar interferir con la escritura
      // Solo aplicar estilos a links
      const links = editorRef.current.querySelectorAll('a');
      links.forEach((link) => {
        link.className = 'blog-link';
        link.style.setProperty('text-decoration', 'underline', 'important');
        link.style.setProperty('text-decoration-line', 'underline', 'important');
        link.style.setProperty('text-decoration-style', 'solid', 'important');
        link.style.setProperty('border-bottom', '1px solid currentColor', 'important');
        link.style.setProperty('cursor', 'pointer', 'important');
        link.style.setProperty('color', 'inherit', 'important');
      });
      
      onChange(currentContent);
      
      // Resetear el flag después de un breve delay
      setTimeout(() => {
        isUserTypingRef.current = false;
      }, 200);
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
    
    if (range) {
      const container = range.commonAncestorContainer;
      const linkElement = container.nodeType === 3 
        ? container.parentElement.closest('a')
        : container.closest('a');
      
      if (linkElement && linkElement.closest('[contenteditable]')) {
        setEditingLink(linkElement);
        setLinkUrl(linkElement.getAttribute('href') || '');
        setShowLinkDialog(true);
        return;
      }
    }
    
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      setEditingLink(null);
      setShowLinkDialog(true);
      setLinkUrl('');
    }
  };

  const insertLink = () => {
    if (!linkUrl.trim()) {
      return;
    }
    
    if (editingLink) {
      editingLink.setAttribute('href', linkUrl);
      editingLink.style.setProperty('text-decoration', 'underline', 'important');
      editingLink.style.setProperty('text-decoration-line', 'underline', 'important');
      editingLink.style.setProperty('text-decoration-style', 'solid', 'important');
      editingLink.style.setProperty('border-bottom', '1px solid currentColor', 'important');
      editingLink.style.setProperty('cursor', 'pointer', 'important');
      editingLink.style.setProperty('color', 'inherit', 'important');
      setEditingLink(null);
      setShowLinkDialog(false);
      setLinkUrl('');
      editorRef.current?.focus();
      handleContentChange();
      return;
    }

    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const link = document.createElement('a');
      link.setAttribute('href', linkUrl);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.setAttribute('contenteditable', 'false');
      link.className = 'blog-link';
      
      const span = document.createElement('span');
      span.style.borderBottom = '1px solid currentColor';
      span.style.textDecoration = 'underline';
      
      try {
        const contents = range.extractContents();
        span.appendChild(contents);
        link.appendChild(span);
        range.insertNode(link);
      } catch (e) {
        const text = selection.toString();
        span.textContent = text;
        link.appendChild(span);
        range.deleteContents();
        range.insertNode(link);
      }
      
      setTimeout(() => {
        link.style.setProperty('text-decoration', 'underline', 'important');
        link.style.setProperty('text-decoration-line', 'underline', 'important');
        link.style.setProperty('text-decoration-style', 'solid', 'important');
        link.style.setProperty('border-bottom', '1px solid currentColor', 'important');
        link.style.setProperty('cursor', 'pointer', 'important');
        link.style.setProperty('color', 'inherit', 'important');
        editorRef.current?.focus();
        handleContentChange();
      }, 50);
    }
    setShowLinkDialog(false);
    setLinkUrl('');
  };

  const insertImage = () => {
    if (!imageUrl.trim()) {
      return;
    }
    
    if (editorRef.current) {
      const imageContainer = document.createElement('div');
      imageContainer.className = 'blog-image-container';
      imageContainer.style.marginTop = '1rem';
      imageContainer.style.marginBottom = '1rem';

      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = imageCaption || 'Imagen';
      img.style.width = '100%';
      img.style.height = 'auto';
      img.style.borderRadius = '0.5rem';
      imageContainer.appendChild(img);

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

  const handleEditorClick = (e) => {
    const target = e.target;
    if (target.tagName === 'A' && target.closest('[contenteditable]')) {
      e.preventDefault();
      e.stopPropagation();
      setEditingLink(target);
      setLinkUrl(target.getAttribute('href') || '');
      setShowLinkDialog(true);
      return;
    }
    
    // Asegurar que el editor mantenga el focus después del click
    if (editorRef.current && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.focus();
    }
    
    // Asegurar que la selección se mantenga en el editor
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!editorRef.current?.contains(range.commonAncestorContainer)) {
          // Si la selección no está en el editor, colocarla al final
          if (editorRef.current) {
            const newRange = document.createRange();
            newRange.selectNodeContents(editorRef.current);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      } else if (editorRef.current) {
        // Si no hay selección, crear una al final
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }, 0);
  };

  const handleEditorMouseDown = (e) => {
    const target = e.target;
    if (target.tagName === 'A' && target.closest('[contenteditable]')) {
      e.preventDefault();
      e.stopPropagation();
      setEditingLink(target);
      setLinkUrl(target.getAttribute('href') || '');
      setShowLinkDialog(true);
      return;
    }
    
    // Asegurar que el editor reciba el focus al hacer click
    if (editorRef.current && !editorRef.current.contains(document.activeElement)) {
      editorRef.current.focus();
    }
  };

  const handleEditorFocus = () => {
    if (editorRef.current) {
      // Solo establecer dir/direction una vez al enfocar, no en cada cambio
      if (!editorRef.current.hasAttribute('data-dir-set')) {
        editorRef.current.setAttribute('dir', 'ltr');
        editorRef.current.style.direction = 'ltr';
        editorRef.current.style.textAlign = 'left';
        editorRef.current.setAttribute('data-dir-set', 'true');
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-white/80 p-2 dark:border-primary/30 dark:bg-darkBg/70">
        <button
          type="button"
          onClick={() => handleFormat('bold')}
          className="rounded p-1.5 text-linkLight transition-colors duration-200 hover:bg-primary/10 hover:text-accent dark:text-linkDark dark:hover:text-primary"
          title="Negrita (Ctrl+B)"
        >
          <FiBold size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleFormat('italic')}
          className="rounded p-1.5 text-linkLight transition-colors duration-200 hover:bg-primary/10 hover:text-accent dark:text-linkDark dark:hover:text-primary"
          title="Cursiva (Ctrl+I)"
        >
          <FiItalic size={16} />
        </button>
        <button
          type="button"
          onClick={() => handleFormat('underline')}
          className="rounded p-1.5 text-linkLight transition-colors duration-200 hover:bg-primary/10 hover:text-accent dark:text-linkDark dark:hover:text-primary"
          title="Subrayado (Ctrl+U)"
        >
          <FiUnderline size={16} />
        </button>
        <div className="h-6 w-px bg-primary/20 dark:bg-primary/30" />
        <button
          type="button"
          onClick={handleLinkShortcut}
          className="rounded p-1.5 text-linkLight transition-colors duration-200 hover:bg-primary/10 hover:text-accent dark:text-linkDark dark:hover:text-primary"
          title="Link (Ctrl+K)"
        >
          <FiLink size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            setShowImageDialog(true);
            setImageUrl('');
            setImageCaption('');
          }}
          className="rounded p-1.5 text-linkLight transition-colors duration-200 hover:bg-primary/10 hover:text-accent dark:text-linkDark dark:hover:text-primary"
          title="Imagen (Ctrl+P)"
        >
          <FiImage size={16} />
        </button>
      </div>
      
      <div
        ref={editorRef}
        contentEditable
        dir="ltr"
        tabIndex={0}
        onInput={handleContentChange}
        onBlur={handleContentChange}
        onFocus={handleEditorFocus}
        onClick={handleEditorClick}
        onMouseDown={handleEditorMouseDown}
        data-placeholder={placeholder}
        className="admin-blog-editor rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-linkLight/50 [&:empty:before]:dark:text-linkDark/50"
        style={{
          minHeight,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          direction: 'ltr',
          textAlign: 'left',
          unicodeBidi: 'embed',
        }}
      />
      
      <p className="text-xs text-linkLight/60 dark:text-linkDark/60">
        Shortcuts: Ctrl+B (negrita), Ctrl+I (cursiva), Ctrl+U (subrayado), Ctrl+K (link), Ctrl+P (imagen).
      </p>

      {/* Dialog para links */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-primary/20 bg-white p-6 shadow-lg dark:border-primary/30 dark:bg-darkBg/70">
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
                }
                if (e.key === 'Escape') {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                  setEditingLink(null);
                }
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={insertLink}
                className="btn-gradient text-xs uppercase"
              >
                {editingLink ? 'Actualizar' : 'Agregar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                  setEditingLink(null);
                }}
                className="rounded-lg border border-primary/20 px-4 py-2 text-sm uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog para imágenes */}
      {showImageDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-lg border border-primary/20 bg-white p-6 shadow-lg dark:border-primary/30 dark:bg-darkBg/70">
            <h3 className="mb-4 text-lg font-semibold text-primary dark:text-linkDark">Agregar imagen</h3>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://ejemplo.com/imagen.jpg"
              className="mb-2 w-full rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
              autoFocus
            />
            <input
              type="text"
              value={imageCaption}
              onChange={(e) => setImageCaption(e.target.value)}
              placeholder="Pie de foto (opcional)"
              className="mb-4 w-full rounded-lg border border-primary/20 bg-white/80 px-3 py-2 text-linkLight transition-colors duration-200 focus:border-primary focus:outline-none dark:border-primary/30 dark:bg-darkBg/70 dark:text-linkDark"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault();
                  insertImage();
                }
                if (e.key === 'Escape') {
                  setShowImageDialog(false);
                  setImageUrl('');
                  setImageCaption('');
                }
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={insertImage}
                className="btn-gradient text-xs uppercase"
              >
                Agregar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowImageDialog(false);
                  setImageUrl('');
                  setImageCaption('');
                }}
                className="rounded-lg border border-primary/20 px-4 py-2 text-sm uppercase tracking-widest text-linkLight transition-colors duration-200 hover:border-primary hover:text-accent dark:border-primary/30 dark:text-linkDark dark:hover:text-primary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
